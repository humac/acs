/**
 * HubSpot CRM API Integration Module
 * 
 * This module provides functions to interact with the HubSpot CRM API
 * for syncing company data into ACS.
 * 
 * HubSpot API Documentation:
 * - Base URL: https://api.hubapi.com
 * - Authentication: Private App Access Token via Bearer token
 * - Companies endpoint: GET /crm/v3/objects/companies
 * - Reference: https://developers.hubspot.com/docs/api/crm/companies
 */


/**
 * Test HubSpot API connection with the provided access token
 * @param {string} accessToken - HubSpot Private App Access Token
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const testHubSpotConnection = async (accessToken) => {
  if (!accessToken) {
    return { success: false, message: 'Access token is required' };
  }

  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/companies?limit=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: `HubSpot API error: ${errorData.message || response.statusText}`
      };
    }

    return {
      success: true,
      message: 'Successfully connected to HubSpot API'
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`
    };
  }
};

/**
 * Fetch companies from HubSpot with pagination support
 * Uses the Search API to filter for only "Won" customers (lifecyclestage = customer)
 * @param {string} accessToken - HubSpot Private App Access Token
 * @returns {Promise<Array>} Array of company objects
 */
export const fetchHubSpotCompanies = async (accessToken) => {
  if (!accessToken) {
    throw new Error('Access token is required');
  }

  const companies = [];
  let after = null;
  const limit = 100; // HubSpot API limit per request

  try {
    do {
      const url = 'https://api.hubapi.com/crm/v3/objects/companies/search';

      // Build request body with filter for customers only
      const requestBody = {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'lifecyclestage',
                operator: 'EQ',
                value: 'customer'
              }
            ]
          }
        ],
        properties: ['name', 'description'],
        limit
      };

      // Add pagination cursor if available
      if (after) {
        requestBody.after = after;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HubSpot API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();

      if (data.results && Array.isArray(data.results)) {
        companies.push(...data.results);
      }

      // Check for pagination
      after = data.paging?.next?.after || null;
    } while (after);

    return companies;
  } catch (error) {
    throw new Error(`Failed to fetch companies from HubSpot: ${error.message}`);
  }
};

/**
 * Sync companies from HubSpot to ACS database
 * @param {string} accessToken - HubSpot Private App Access Token
 * @param {Object} companyDb - Company database methods
 * @param {Object} auditDb - Audit log database methods
 * @param {string} userEmail - Email of user performing the sync
 * @returns {Promise<{companiesFound: number, companiesCreated: number, companiesUpdated: number, errors: Array}>}
 */
export const syncCompaniesToACS = async (accessToken, companyDb, auditDb, userEmail = null) => {
  const result = {
    companiesFound: 0,
    companiesCreated: 0,
    companiesUpdated: 0,
    companiesSkipped: 0,
    errors: []
  };

  try {
    // Fetch all companies from HubSpot
    const hubspotCompanies = await fetchHubSpotCompanies(accessToken);
    result.companiesFound = hubspotCompanies.length;

    // Track individual changes for the summary audit log
    const created = [];
    const updated = [];
    const linked = [];

    // Sync each company
    for (const hsCompany of hubspotCompanies) {
      try {
        const hubspotId = hsCompany.id;
        const name = hsCompany.properties?.name || `HubSpot Company ${hubspotId}`;
        const description = hsCompany.properties?.description || '';

        // Check if company already exists by HubSpot ID
        const existingCompany = await companyDb.getByHubSpotId(hubspotId);

        if (existingCompany) {
          // Update existing company if data has changed
          // Normalize both sides: trim whitespace, coerce null/undefined to ''
          const normalize = (val) => (val == null ? '' : String(val)).trim();
          const existingName = normalize(existingCompany.name);
          const newName = normalize(name);
          const existingDesc = normalize(existingCompany.description);
          const newDesc = normalize(description);
          const nameChanged = existingName !== newName;
          const descChanged = existingDesc !== newDesc;
          if (nameChanged || descChanged) {
            await companyDb.updateByHubSpotId(hubspotId, { name: name?.trim(), description: description?.trim() });
            result.companiesUpdated++;
            updated.push(name);
          }
        } else {
          // Check if a company with the same name already exists (but different HubSpot ID)
          const companyByName = await companyDb.getByName(name);

          if (companyByName) {
            if (companyByName.hubspot_id) {
              // Company already linked to a different HubSpot record (duplicate name in HubSpot) - skip
              result.companiesSkipped++;
            } else {
              // Company exists with same name but no HubSpot ID - link it and sync description
              await companyDb.setHubSpotId(companyByName.id, hubspotId);
              await companyDb.update(companyByName.id, { name: name?.trim(), description: description?.trim() });
              result.companiesUpdated++;
              linked.push(name);
            }
          } else {
            // Create new company with HubSpot ID
            await companyDb.createWithHubSpotId({
              name,
              description,
              hubspot_id: hubspotId
            });
            result.companiesCreated++;
            created.push(name);
          }
        }
      } catch (error) {
        result.errors.push({
          company_id: hsCompany.id,
          company_name: hsCompany.properties?.name || 'Unknown',
          error: error.message
        });
      }
    }

    // Write a single summary audit log instead of one per company
    if (result.companiesCreated > 0 || result.companiesUpdated > 0 || result.errors.length > 0) {
      const details = JSON.stringify({
        found: result.companiesFound,
        created: { count: result.companiesCreated, companies: created },
        updated: { count: result.companiesUpdated, companies: [...updated, ...linked] },
        linked: { count: linked.length, companies: linked },
        skippedDuplicates: result.companiesSkipped,
        errors: result.errors.length
      });

      await auditDb.log(
        'sync',
        'company',
        null,
        'HubSpot Company Sync',
        details,
        userEmail
      );
    }
  } catch (error) {
    throw new Error(`HubSpot sync failed: ${error.message}`);
  }

  return result;
};
