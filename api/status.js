import { find_nodes, find_path } from '/util/network-utils.js'

const apiUrl = 'http://192.168.178.97:5000/bitburner/status'

let portOpenerMap = []
let playerHackLevel = 0

/** 
 * @param {import("../.project/index.d.ts").NS } ns 
 */
export async function main(ns) {
    ns.disableLog("ALL");

    ns.clearLog()

    while(true) {
        let status = {}

        portOpenerMap = [
            [`BruteSSH.exe`, `sshPortOpen`, ns.brutessh, ns.fileExists(`BruteSSH.exe`, 'home')],
            [`FTPCrack.exe`, `ftpPortOpen`, ns.ftpcrack, ns.fileExists(`FTPCrack.exe`, 'home')],
            [`relaySMTP.exe`, `smtpPortOpen`, ns.relaysmtp, ns.fileExists(`relaySMTP.exe`, 'home')],
            [`HTTPWorm.exe`, `httpPortOpen`, ns.httpworm, ns.fileExists(`HTTPWorm.exe`, 'home')],
            [`SQLInject.exe`, `sqlPortOpen`, ns.sqlinject, ns.fileExists(`SQLInject.exe`, 'home')],
        ]

        playerHackLevel = ns.getHackingLevel()
        
        // fetch servers
        status['servers'] = await fetchServers(ns)

        // fetch player status

        // send data
        try {
            await fetch(apiUrl, {
                method: 'POST', 
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({status: status})
            })
        } catch (exception) {
            ns.tprint('Server unreachable')
        }

        // ns.tprint('Sent server data. Status: ' + response.status)

        await ns.sleep(1000)
    }
}

/** 
 * @param {import("../.project/index.d.ts").NS } ns 
 */
async function fetchServers(ns) {
    let servers = []
    let serverIdMap = {}
    let serverId = 0
    const nodes = await find_nodes(ns, 'home', ['home']);

    nodes.forEach(node => {
        try {
            let server = ns.getServer(node)
            
            if (!server.hasAdminRights)
                tryAutoPen(ns, server);

            if (server.hasAdminRights && !server.purchasedByPlayer && !server.backdoorInstalled)
                tryInstallBackdoor(ns, server);

            server.files = ns.ls(node)
            server.adjacent = ns.scan(node)
            // s.worker_running = ns.scriptRunning('/api/work-receiver.js', node)
            
            server.id = serverId
            serverIdMap[server.hostname] = serverId

            servers.push(server)

            serverId++;
        } catch (exception) {
            ns.print('[ERR]: Skipped server ' + node + ': exception ' + exception)
        }            
    })

    servers.forEach(s => {
        // Iterate over each item in the value.adjacent array
        s.adjacent = s.adjacent.map(item => {
            // Check if the item exists in the serverIdMap
            if (serverIdMap.hasOwnProperty(item)) {
                // Replace the item with its corresponding value from the serverIdMap
                return serverIdMap[item];
            } else {
                // If the item is not in the serverIdMap, return the item as is or handle the case as needed
                return item;
            }
        });
    })

    return servers;
}

/** 
 * @param {import("../.project/index.d.ts").NS } ns 
 * @param {import("../.project/index.d.ts").Server } target
 */
function tryAutoPen(ns, target) {
    let openPorts = target.openPortCount;
    let requiredPorts = target.numOpenPortsRequired;

    let server_level = target.requiredHackingSkill
    if (server_level > playerHackLevel) {
        // ns.print('[LOG]: - Skipping server ' + target + ' (Level insufficient: ' + playerHackLevel + '/' + server_level + ')');
        return;
    }


    for (const line of portOpenerMap) {
        let program = line[0]
        let property = line[1]
        let fun = line[2]
        let avail = line[3]

        if (openPorts >= requiredPorts) {
            // ns.print('[LOG]: - Enough ports opened.')
            break;
        }

        if (!target[property] && avail) {
            fun(target.hostname)
            // ns.print('[LOG]: - Executing ' + program);
            ++openPorts;
        }
    }

    if (!ns.hasRootAccess(target.hostname)) {
        // ns.print('[LOG]: Nuke ' + target.hostname);
        // ns.print('[LOG]: - Ports open: ' + openPorts);
        // ns.print('[LOG]: - Ports required: ' + requiredPorts);

        if (openPorts >= requiredPorts) {
            // ns.print('[LOG]: - Enough ports open. Attempting nuke');
            ns.nuke(target.hostname);
            ns.print('Gained Access to ' + target.hostname, "SUCCESS");

            // used only for updates in the current cycle, next cycle it will be fetched from game data again.
            target.hasAdminRights = true;
        }
        
        if (target.hasAdminRights
            && target.purchasedByPlayer == false
            && server_level <= playerHackLevel) {
            const scriptName = 'hack-temp.js'
            ns.killall(target.hostname)
            let threads = Math.floor((target.maxRam - target.ramUsed) / ns.getScriptRam(scriptName));

            if (threads > 0) {
                ns.scp(scriptName, target.hostname)
                ns.exec(scriptName, target.hostname, threads, target.hostname)
            }
        } else if (server_level > playerHackLevel) {
            ns.print('Cannot run auto hacker on ' + target.hostname + ' due to skill issue!', 'ERROR');
        }
    }
}

/** 
 * @param {import("../.project/index.d.ts").NS } ns 
 * @param {import("../.project/index.d.ts").Server } target
 */
async function tryInstallBackdoor(ns, target) {
    // try{
    //     await ns.singularity.installBackdoor(target.hostname)
    // } catch (exception) {
        // Acquire a reference to the terminal text field
        const terminalInput = document.getElementById("terminal-input");

        if (!terminalInput || terminalInput.disabled)
            return;

        var test = (find_path(ns, target.hostname).map(x => (x == 'home' ? '' : 'connect ') + x).join(';')) + ';backdoor'

        // Set the value to the command you want to run.
        terminalInput.value=test;

        // Get a reference to the React event handler.
        const handler = Object.keys(terminalInput)[1];

        // Perform an onChange event to set some internal values.
        terminalInput[handler].onChange({target:terminalInput});

        // Simulate an enter press
        terminalInput[handler].onKeyDown({key:'Enter',preventDefault:()=>null});
    // }
}

// function addPathToObject(obj, path, content) {
//     var parts = path.split('/')
//     var folder = parts.slice(0, -1)
//     var fileName = parts.slice(-1)
//     let current = obj;

//     // Traverse the path and create nested objects if necessary
//     folder.forEach(part => {
//         if (!current[part]) {
//             current[part] = {};
//         }
//         current = current[part];
//     });

//     // Ensure the 'files' array exists in the current object
//     if (!current.files) {
//         current.files = [];
//     }

//     // Add the file to the 'files' array
//     current.files.push({name: fileName[0], content: content});
// }