#!/bin/sh
set -e

# =============================================================================
# Docker Entrypoint Script
# Purpose: Handle runtime environment variable injection and start Nginx
# =============================================================================

echo "Starting container initialization..."

# Environment variable for configuration
ENV_NAME=${ENV_NAME:-prod}

echo "Environment: $ENV_NAME"

# Function to inject environment variables into JavaScript files
inject_env_vars() {
	local file=$1
	echo "Processing: $file"

	# Replace placeholder environment variables in runtime config
	# This allows configuration to be set at container runtime
	if [ -f "$file" ]; then
		# Use envsubst to replace environment variables
		# Only replace known variables to avoid breaking the JS
		envsubst <"$file" >"${file}.tmp" && mv "${file}.tmp" "$file"
	fi
}

# Process environment configuration file if it exists
ENV_CONFIG_FILE="/usr/share/nginx/html/env-config.js"
if [ -f "$ENV_CONFIG_FILE" ]; then
	echo "Injecting environment variables into $ENV_CONFIG_FILE"
	inject_env_vars "$ENV_CONFIG_FILE"
fi

# Process config files if they exist
if [ -d "/usr/share/nginx/html/config" ]; then
	echo "Configuration directory found"
# You can add additional runtime configuration processing here if needed
fi

# Ensure proper permissions
echo "Setting up permissions..."
chmod -R 755 /usr/share/nginx/html

echo "Container initialization complete"
echo "Starting Nginx..."

# Execute the CMD (nginx)
exec "$@"
