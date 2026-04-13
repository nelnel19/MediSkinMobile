const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withNetworkSecurity(config) {
  // Create the network security config XML file
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const platformDir = config.modRequest.platformProjectRoot;
      
      // Create the XML directory if it doesn't exist
      const resDir = path.join(platformDir, 'app/src/main/res');
      const xmlDir = path.join(resDir, 'xml');
      
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }
      
      // Create network_security_config.xml with proper configuration
      // USING YOUR CORRECT URLS
      const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Base configuration with trust anchors -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
    
    <!-- Development domains - allow cleartext for local testing -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">10.0.3.2</domain>
        <domain includeSubdomains="true">192.168.1.0/24</domain>
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </domain-config>
    
    <!-- Production Render.com domains - HTTPS only -->
    <!-- USING YOUR ACTUAL DEPLOYED URLS -->
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">onrender.com</domain>
        <domain includeSubdomains="true">mediskin-backend-node.onrender.com</domain>
        <domain includeSubdomains="true">mediskin-backend-python.onrender.com</domain>
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </domain-config>
</network-security-config>`;
      
      const filePath = path.join(xmlDir, 'network_security_config.xml');
      fs.writeFileSync(filePath, networkSecurityConfig, 'utf-8');
      console.log('✅ Created network_security_config.xml at:', filePath);
      console.log('✅ Using backend URLs:', {
        node: 'https://mediskin-backend-node.onrender.com',
        python: 'https://mediskin-backend-python.onrender.com'
      });
      
      return config;
    },
  ]);

  // Add reference to AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];
    
    // Add network security config reference
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    application.$['android:usesCleartextTraffic'] = 'true';
    
    return config;
  });

  return config;
};