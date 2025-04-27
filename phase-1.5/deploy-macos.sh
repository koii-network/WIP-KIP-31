#!/bin/bash

# Exit on error
set -e

# Configuration
APP_NAME="koii-mining"
APP_DIR="$HOME/Library/Application Support/$APP_NAME"
LOG_DIR="$HOME/Library/Logs/$APP_NAME"

# Create application directory
echo "Creating application directory..."
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/src"
mkdir -p "$APP_DIR/data"
mkdir -p "$LOG_DIR"

# Copy application files
echo "Copying application files..."
cp -r src/* "$APP_DIR/src/"
cp requirements.txt "$APP_DIR/"
cp start.sh "$APP_DIR/"
chmod +x "$APP_DIR/start.sh"

# Install dependencies
echo "Installing dependencies..."
cd "$APP_DIR"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create launchd service
echo "Creating launchd service..."
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$HOME/Library/LaunchAgents/com.$APP_NAME.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.$APP_NAME</string>
    <key>ProgramArguments</key>
    <array>
        <string>$APP_DIR/start.sh</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$APP_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>$LOG_DIR/error.log</string>
    <key>StandardOutPath</key>
    <string>$LOG_DIR/output.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$APP_DIR/venv/bin</string>
        <key>PYTHONPATH</key>
        <string>$APP_DIR</string>
        <key>PORT</key>
        <string>8085</string>
        <key>LOG_LEVEL</key>
        <string>INFO</string>
        <key>DB_PATH</key>
        <string>$APP_DIR/data/shares.db</string>
    </dict>
</dict>
</plist>
EOF

# Stop existing service if running
echo "Stopping existing service..."
launchctl unload "$HOME/Library/LaunchAgents/com.$APP_NAME.plist" 2>/dev/null || true

# Install launchd service
echo "Installing launchd service..."
launchctl load "$HOME/Library/LaunchAgents/com.$APP_NAME.plist"

echo "Deployment completed successfully!"
echo "Service status:"
launchctl list | grep $APP_NAME

echo -e "\nApplication deployed to: $APP_DIR"
echo "Logs available at: $LOG_DIR"
echo "To view logs:"
echo "  tail -f $LOG_DIR/error.log"
echo "  tail -f $LOG_DIR/output.log" 