/**
 * A client library for the w3name - IPNS over HTTP API. It provides a
 * convenient interface for creating names, making revisions to name records,
 * and publishing and resolving them via the HTTP API.
 *
 * @example
 * ```js
 * import * as Name from 'w3name'
 *
 * const name = await Name.create()
 *
 * console.log('Name:', name.toString())
 * // e.g. k51qzi5uqu5di9agapykyjh3tqrf7i14a7fjq46oo0f6dxiimj62knq13059lt
 *
 * // The value to publish
 * const value = '/ipfs/bafkreiem4twkqzsq2aj4shbycd4yvoj2cx72vezicletlhi7dijjciqpui'
 * const revision = await Name.v0(name, value)
 *
 * // Publish the revision
 * await Name.publish(revision, name.key)
 *
 * // Resolve the latest value
 * await Name.resolve(name)
 * ```
 * @module
 */

import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { keys, PrivateKey, PublicKey } from 'libp2p-crypto'
import { identity } from 'multiformats/hashes/identity'
import { base36 } from 'multiformats/bases/base36'
import { CID } from 'multiformats/cid'
import * as Digest from 'multiformats/hashes/digest'
import * as ipns from 'ipns'
import * as cbor from 'cborg'
import W3NameService from './service'
import fetch from '@web-std/fetch'

const libp2pKeyCode = 0x72
const ONE_YEAR = 1000 * 60 * 60 * 24 * 365

const defaultValidity = (): string => new Date(Date.now() + ONE_YEAR).toISOString()

const defaultService = new W3NameService()
/**
 * Name is an IPNS key ID.
 *
 * Names can be used to retrieve the latest published value from the W3name service
 * using the {@link resolve} function.
 *
 * Note that `Name` contains only the public verification key and does not allow publishing
 * or updating records. To create or update a record, use the {@link WritableName} subclass.
 *
 * To convert from a string representation of a name to a `Name` object use the {@link parse} function.
 */
export class Name {
  /** @internal */
  _pubKey: PublicKey

  constructor (pubKey: PublicKey) {
    /**
     * @private
     */
    this._pubKey = pubKey
  }

  /**
   * A binary representation of the IPNS verification key.
   */
  get bytes (): Uint8Array {
    const digest = Digest.create(identity.code, this._pubKey.bytes)
    return CID.createV1(libp2pKeyCode, digest).bytes
  }

  /**
   * @returns the string representation of the IPNS verification key (e.g. `k51qzi5uqu5di9agapykyjh3tqrf7i14a7fjq46oo0f6dxiimj62knq13059lt`)
   */
  toString (): string {
    const digest = Digest.create(identity.code, this._pubKey.bytes)
    return CID.createV1(libp2pKeyCode, digest).toString(base36)
  }
}

/**
 * WritableName is a {@link Name} that has a signing key associated with it such that
 * new IPNS record {@link Revision}s can be created and signed for it.
 *
 * New `WritableName`s can be generated using the {@link create} function.
 *
 * To load a `WritableName` from a saved binary representation, see {@link from}.
 */
export class WritableName extends Name {
  /** @internal */
  _privKey: PrivateKey

  constructor (privKey: PrivateKey) {
    super(privKey.public)
    /**
     * @private
     */
    this._privKey = privKey
  }

  /**
   * The private signing key, as a libp2p `PrivateKey` object.
   *
   * To save a key for later loading with {@link from}, write the
   * contents of `key.bytes` somewhere safe.
   */
  get key (): PrivateKey {
    return this._privKey
  }
}

/**
 * Create a new name with associated signing key that can be used to create and
 * publish IPNS record revisions.
 */
export async function create (): Promise<WritableName> {
  const privKey = await keys.generateKeyPair('Ed25519', 2048)
  return new WritableName(privKey)
}

/**
 * Parses a string-encoded {@link Name} to a {@link Name} object.
 *
 * Note that this returns a read-only {@link Name}, which can be used to {@link resolve} values
 * but cannot {@link publish} them.
 */
export function parse (name: string): Name {
  const keyCid = CID.parse(name, base36)
  if (keyCid.code !== libp2pKeyCode) {
    throw new Error(`Invalid key, expected ${libp2pKeyCode} codec code but got ${keyCid.code}`)
  }
  const pubKey = keys.unmarshalPublicKey(Digest.decode(keyCid.multihash.bytes).bytes)
  return new Name(pubKey)
}

/**
 * Creates a {@link WritableName} from an existing signing key (private key).
 *
 * Expects the given `Uint8Array` to contain a binary representation of a
 * private signing key. Note that this is **not** the same as the output of
 * {@link Name#bytes | Name.bytes}, which always returns an encoding of the _public_ key,
 * even when the name in question is a {@link WritableName}.
 *
 * To save the key for a {@link WritableName} so that it can be used with this
 * function, use `key.bytes`, for example:
 *
 * @example
 * ```js
 * import * as Name from 'w3name'
 * import fs from 'fs'
 *
 * async function example() {
 *   const myName = await Name.create()
 *
 *   // myName.key.bytes can now be written to disk / database, etc.
 *   await fs.promises.writeFile('myName.key', myName.key.bytes)
 *
 *   // let's pretend some time has passed and we want to load the
 *   // key from disk:
 *   const loadedBytes = await fs.promises.readFile('myName.key')
 *   const myName2 = await Name.from(loadedBytes)
 *
 *   // myName and myName2 can now be used interchangeably
 * }
 * ```
 *
 */
export async function from (key: Uint8Array): Promise<WritableName> {
  const privKey = await keys.unmarshalPrivateKey(key)
  return new WritableName(privKey)
}

/**
 * Create an initial version of the IPNS record for the passed {@link Name}, set to the
 * passed value.
 *
 * Note that the returned {@link Revision} object must be {@link publish}ed before it
 * can be {@link resolve}d using the service.
 */
export async function v0 (name: Name, value: string): Promise<Revision> {
  return new Revision(name, value, 0n, defaultValidity())
}

/**
 * Create a {@link Revision} of the passed IPNS record by incrementing the sequence
 * number and changing the value.
 *
 * This returns a new {@link Revision} and  does not alter the original `revision` argument.
 */
export async function increment (revision: Revision, value: string): Promise<Revision> {
  const seqno = revision.sequence + 1n
  return new Revision(revision.name, value, seqno, defaultValidity())
}

/**
 * A representation of a IPNS record that may be initial or revised.
 */
export class Revision {
  /** @internal */
  _name: Name

  /** @internal */
  _value: string

  /** @internal */
  _sequence: bigint

  /** @internal */
  _validity: string

  constructor (name: Name, value: string, sequence: bigint, validity: string) {
    this._name = name
    if (typeof value !== 'string') {
      throw new Error('invalid value')
    }
    this._value = value
    if (typeof sequence !== 'bigint') {
      throw new Error('invalid sequence number')
    }
    this._sequence = sequence
    if (typeof validity !== 'string') {
      throw new Error('invalid validity')
    }
    // TODO: validate format
    this._validity = validity
  }

  get name (): Name {
    return this._name
  }

  get value (): string {
    return this._value
  }

  get sequence (): bigint {
    return this._sequence
  }

  /**
   * RFC3339 date string.
   */
  get validity (): string {
    return this._validity
  }

  /**
   * Encodes a `Revision` to a binary representation and returns it as a `Uint8Array`.
   *
   * Note: if `revision.name` is a `WritableName` then signing key data will be
   * lost. i.e. the private key is not encoded.
   */
  static encode (revision: Revision): Uint8Array {
    return cbor.encode({
      name: revision._name.toString(),
      value: revision._value,
      sequence: revision._sequence,
      validity: revision._validity
    })
  }

  /**
   * Decodes a `Revision` from a binary representation.
   *
   * @param bytes - a `Uint8Array` containing a binary encoding of a `Revision`, as produced by {@link #encode}.
   * @returns a {@link Revision} object
   * @throws if `bytes` does not contain a valid encoded `Revision`
   */
  static decode (bytes: Uint8Array): Revision {
    const raw = cbor.decode(bytes)
    const name = parse(raw.name)
    return new Revision(name, raw.value, BigInt(raw.sequence), raw.validity)
  }
}

/**
 * Publish a name {@link Revision} to W3name.
 *
 * Names should be {@link resolve}-able immediately via the w3name service, and will be
 * provided to the IPFS DHT network.
 *
 * Note that it may take a few seconds for the record to propagate and become available via
 * the IPFS DHT network and IPFS <-> HTTP gateways.
 */
export async function publish (revision: Revision, key: PrivateKey, service: W3NameService = defaultService): Promise<void> {
  const url = new URL(`name/${revision.name.toString()}`, service.endpoint)
  const entry = await ipns.create(
    key,
    uint8ArrayFromString(revision.value),
    revision.sequence,
    new Date(revision.validity).getTime() - Date.now()
  )
  await service.waitForRateLimit()
  await maybeHandleError(fetch(url.toString(), {
    method: 'POST',
    body: uint8ArrayToString(ipns.marshal(entry), 'base64pad')
  }))
}

/**
 * Resolve the current IPNS record revision for the passed name.
 *
 * Note that this will only resolve names published using the W3name service. Names published by
 * other IPNS implementations should be resolved using a DHT-backed implementation (e.g. kubo, js-ipfs, etc).
 */
export async function resolve (name: Name, service: W3NameService = defaultService): Promise<Revision> {
  const url = new URL(`name/${name.toString()}`, service.endpoint)
  await service.waitForRateLimit()

  const res: globalThis.Response = await maybeHandleError(fetch(url.toString()))
  const { record } = await res.json()

  const entry = ipns.unmarshal(uint8ArrayFromString(record, 'base64pad'))
  const keyCid = CID.decode(name.bytes)
  const pubKey = keys.unmarshalPublicKey(Digest.decode(keyCid.multihash.bytes).bytes)

  await ipns.validate(pubKey, entry)

  return new Revision(
    name,
    uint8ArrayToString(entry.value),
    entry.sequence,
    uint8ArrayToString(entry.validity)
  )
}

async function maybeHandleError (resPromise: Promise<globalThis.Response>): Promise<globalThis.Response> {
  const res = await resPromise
  if (res.ok) return res
  let error
  try {
    const parsedError = await res.json()
    error = new Error(parsedError.message)
  } catch (jsonParseError) {
    error = new Error(`unexpected response from API, cannot parse error response. Received status: ${res.status}`)
  }
  throw error
}
