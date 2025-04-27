<h1 align="center">⁂<br/>w3name</h1>
<p align="center">The JavaScript API client for <a href="https://web3.storage/products/w3name/">w3name</a></p>


## Getting started

Install the package using npm

```shell
npm install w3name
```

or yarn:

```shell
yarn add w3name
```

See [the getting started docs][w3storage-docs-w3name-getting-started] for more information.

You can also find full API reference documentation for the client at https://web3-storage.github.io/w3name

## Usage

The `w3name` package exposes several "top-level" or module-scoped functions like [`create`][typedoc-create], [`resolve`][typedoc-resolve], and [`publish`][typedoc-publish], along with a few classes like [`Revision`][typedoc-Revision] and [`Name`][typedoc-Name] that are returned from and accepted by the API functions.

In the examples below, the module is imported as `Name` using the ES module import syntax:

```js
import * as Name from 'w3name'
```

If you happen to already have something called `Name` in scope, you can choose a different identifier when importing, or simply import the functions you need:

```js
import { create, publish } from 'w3name'
```


### Mutability

w3name is an implementation of IPNS (the InterPlanetary Name System), which was designed to work with IPFS (the InterPlanetary File System). 

IPFS allows you to uniquely identify any piece of data using a cryptographic hash of the data itself. This is known as [content addressing][w3storage-docs-content-addressing], and it's a very powerful and useful idea, especially when building distributed systems that span the planet (and ideally, beyond).

One of the major constraints of a content-addressed system is that all such addresses are _immutable_, meaning that they can't be changed to refer to something else after they've been created.

w3name and other IPNS implementations allow you to create _mutable_ references that can be updated over time, while still providing cryptographic verification that nothing has been tampered with.

A "name" in the context of `w3name` is an identifier for a public key. The creator of the name can use their private key to publish records that will be returned when anyone fetches the latest value of the name. Because the name contains the verification key material, anyone can verify that the returned value was signed with the correct key and has not been tampered with since publication.

Below are some examples of the main use cases for the w3name library. 

#### Create and Publish

The [`create`][typedoc-create] function creates a new keypair, returing a [`WritableName`][typedoc-WritableName] object that can publish signed records to the w3name service.

Once you've created a [`WritableName`][typedoc-WritableName], you can create the initial [`Revision`][typedoc-Revision], which contains the value that you want to publish, along with some internal data like a sequence number to keep track of revisions.

When creating the initial revision for a name, use the [`v0`][typedoc-v0] function. Subsequent revisions will use the [`increment`][typedoc-increment] function, as described in the [update](#update) section below.

With a name and a revision in hand, you're ready to call [`publish`][typedoc-publish], which signs the revision with your key and submits it to the w3name service.

```js
import * as Name from 'w3name'

const name = await Name.create()

console.log('Name:', name.toString())
// e.g. k51qzi5uqu5di9agapykyjh3tqrf7i14a7fjq46oo0f6dxiimj62knq13059lt

// The value to publish
const value = '/ipfs/bafkreiem4twkqzsq2aj4shbycd4yvoj2cx72vezicletlhi7dijjciqpui'
const revision = await Name.v0(name, value)

await Name.publish(revision, name.key)
```

⚠️ Note: revisions live for 1 year after creation by default.

#### Resolve

The [`resolve`][typedoc-resolve] function retrieves the latest value for a name by sending a request to the w3name service.

In the example below, we use the [`parse`][typedoc-parse] function to convert a string-encoded name into a [`Name`][typedoc-Name] object. Note that the [`Name`][typedoc-Name] returned by [`parse`][typedoc-parse] is not writable, unlike the [`WritableName`][typedoc-WritableName]s returned by [`create`][typedoc-create]. As such, you can use [`parse`][typedoc-parse]d names to retrieve and verify values, but they are unable to create and update records.

```js
import * as Name from 'w3name'

const name = Name.parse('k51qzi5uqu5di9agapykyjh3tqrf7i14a7fjq46oo0f6dxiimj62knq13059lt')

const revision = await Name.resolve(name)

console.log('Resolved value:', revision.value)
// e.g. /ipfs/bafkreiem4twkqzsq2aj4shbycd4yvoj2cx72vezicletlhi7dijjciqpui
```

#### Update

Updating records involves creating a new _revision_ from the previous one.

When creating the initial revision, we used the [`v0`][typedoc-v0] function. All subsequent revisions must use the [`increment`][typedoc-increment] function, which accepts a [`Revision`][typedoc-Revision] object describing the current state, and returns a new [`Revision`][typedoc-Revision] with the new value and an incremented sequence number. Attempting to publish a new [`Revision`][typedoc-Revision] with a sequence number thats less than or equal to the current value will result in an error.

```js
import * as Name from 'w3name'

const name = await Name.create()

const value = '/ipfs/bafkreiem4twkqzsq2aj4shbycd4yvoj2cx72vezicletlhi7dijjciqpui'
const revision = await Name.v0(name, value)

await Name.publish(revision, name.key)

// ...later

const nextValue = '/ipfs/bafybeiauyddeo2axgargy56kwxirquxaxso3nobtjtjvoqu552oqciudrm'
// Make a revision to the current record (increments sequence number and sets value)
const nextRevision = await Name.increment(revision, nextValue)

await Name.publish(nextRevision, name.key)
```

#### Signing Key Management

The private key used to sign IPNS records should be saved if a revision needs to be created in the future.

The [`WritableName`][typedoc-WritableName] object returned by the [`create`][typedoc-create] function has a `key` property containing the private signing key. Using `key.bytes`, we can obtain a `Uint8Array` filled with a binary representation of the private key, which can be saved to a safe location.

Later, you can use the [`from`][typedoc-from] function to convert from the binary representation to a [`WritableName`][typedoc-WritableName] object that can be used for signing and publication.

```js
import * as Name from 'w3name'
import fs from 'fs'

// Creates a new "writable" name with a new signing key
const name = await Name.create()

// Store the signing key to a file for use later
await fs.promises.writeFile('priv.key', name.key.bytes)

// ...later

const bytes = await fs.promises.readFile('priv.key')
const name = await Name.from(bytes)

console.log('Name:', name.toString())
// e.g. k51qzi5uqu5di9agapykyjh3tqrf7i14a7fjq46oo0f6dxiimj62knq13059lt
```

#### Revision Serialization/Deserialization

The current revision for a name may need to be serialized to be stored on disk or transmitted and then deserialized later. Note that revisions are _not_ IPNS records - they carry similar data, but are not signed.

```js
import * as Name from 'w3name'
import fs from 'fs'

const { Revision } = Name
const name = await Name.create()
const value = '/ipfs/bafkreiem4twkqzsq2aj4shbycd4yvoj2cx72vezicletlhi7dijjciqpui'
const revision = await Name.v0(name, value)

// Store the record to a file for use later
// Note: Revision.encode does NOT encode signing key data
await fs.promises.writeFile('ipns.revision', Revision.encode(revision))

// ...later

const bytes = await fs.promises.readFile('ipns.revision')
const revision = Revision.decode(bytes)
```

[w3storage-docs-content-addressing]: https://web3.storage/docs/concepts/content-addressing/
[w3storage-docs-w3name-getting-started]: https://web3.storage/docs/how-tos/w3name/#getting-started

[typedoc-create]: https://web3-storage.github.io/w3name/functions/create.html
[typedoc-from]: https://web3-storage.github.io/w3name/functions/from.html
[typedoc-increment]: https://web3-storage.github.io/w3name/functions/increment.html
[typedoc-parse]: https://web3-storage.github.io/w3name/functions/parse.html
[typedoc-publish]: https://web3-storage.github.io/w3name/functions/publish.html
[typedoc-resolve]: https://web3-storage.github.io/w3name/functions/resolve.html
[typedoc-v0]: https://web3-storage.github.io/w3name/functions/v0.html

[typedoc-Name]: https://web3-storage.github.io/w3name/classes/Name.html
[typedoc-WritableName]: https://web3-storage.github.io/w3name/classes/WritableName.html
[typedoc-Revision]: https://web3-storage.github.io/w3name/classes/Revision.html
