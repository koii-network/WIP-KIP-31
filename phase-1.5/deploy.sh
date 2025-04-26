#!/bin/bash

# Exit on error
set -e

# Configuration
APP_NAME="koii-mining"
APP_DIR="/opt/$APP_NAME"
SERVICE_FILE="/etc/systemd/system/$APP_NAME.service"
LOGROTATE_FILE="/etc/logrotate.d/$APP_NAME"

# Create application directory
echo "Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Copy application files
echo "Copying application files..."
cp -r src/* $APP_DIR/src/
cp requirements.txt $APP_DIR/
cp start.sh $APP_DIR/
chmod +x $APP_DIR/start.sh

# Install dependencies
echo "Installing dependencies..."
cd $APP_DIR
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create systemd service
echo "Creating systemd service..."
sudo cp koii-mining.service $SERVICE_FILE
sudo systemctl daemon-reload

# Create logrotate configuration
echo "Configuring log rotation..."
sudo cp koii-mining.logrotate $LOGROTATE_FILE

# Create koii user if it doesn't exist
if ! id "koii" &>/dev/null; then
    echo "Creating koii user..."
    sudo useradd -r -s /bin/false koii
fi

# Set permissions
echo "Setting permissions..."
sudo chown -R koii:koii $APP_DIR
sudo chmod 750 $APP_DIR

# Start the service
echo "Starting service..."
sudo systemctl enable $APP_NAME
sudo systemctl start $APP_NAME

echo "Deployment completed successfully!"
echo "Service status:"
sudo systemctl status $APP_NAME 