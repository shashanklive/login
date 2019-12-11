import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';

import { FormatType, SecretParser } from 'actions-secret-parser';

const AZURE_HTTP_USER_AGENT: string = 'python/3.6.4 msrest_azure/0.5.0 azure-mgmt-web/0.40.0 Azure-SDK-For-Python AZURECLI/2.0.47 GITHUBACTIONS_MyAzure Loginv2_bcstestit/cli';
var azPath: string;

async function main() {
    try{
        azPath = await io.which("az", true);
        await executeAzCliCommand("--version");

        let creds = core.getInput('creds', { required: true });
        let secrets = new SecretParser(creds, FormatType.JSON);
        let servicePrincipalId = secrets.getSecret("$.clientId", false);
        let servicePrincipalKey = secrets.getSecret("$.clientSecret", true);
        let tenantId = secrets.getSecret("$.tenantId", false);
        let subscriptionId = secrets.getSecret("$.subscriptionId", false);
        if (!servicePrincipalId || !servicePrincipalKey || !tenantId || !subscriptionId) {
            throw new Error("Not all values are present in the creds object. Ensure clientId, clientSecret, tenantId and subscriptionId are supplied. For more information refer https://aka.ms/create-secrets-for-GitHub-workflows");
        }

        await executeAzCliCommand(`login --service-principal -u "${servicePrincipalId}" -p "${servicePrincipalKey}" --tenant "${tenantId}"`);
        await executeAzCliCommand(`account set --subscription "${subscriptionId}"`);
        console.log("Setting user agent");
        core.exportVariable('AZURE_HTTP_USER_AGENT', 'python/3.6.4 msrest_azure/0.5.0 azure-mgmt-web/0.40.0 Azure-SDK-For-Python AZURECLI/2.0.47 GITHUBACTIONS_MyAzure Login_bcstestit/cli');
        console.log("${AZURE_HTTP_USER_AGENT}");
        console.log("Login successful. V2");    
    } catch (error) {
        console.log("Login failed. Please check the credentials.");
        core.setFailed(error);
    }
}

async function executeAzCliCommand(command: string) {
    try {
        await exec.exec(`"${azPath}" ${command}`, [],  {}); 
    }
    catch(error) {
        throw new Error(error);
    }
}


main();
