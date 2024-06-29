/**
* @param {import("./.project/index").NS } ns 
*/
export async function main(ns) {
    const host = ns.getHostname();
    const script = ns.getScriptName();
    const flags = ns.flags([
        // enable logs from ns
        ['verbose', false],
        ['v', false],

        // disable killall
        ['safeguard', false],
        ['s', false]
    ])

    if (!(flags.v || flags.verbose))
        ns.disableLog('ALL')

    // kill all other scripts on this machine
    if (!(flags.s || flags.safeguard))
        ns.killall(null, true)

    // remove all local files except base files
    ns.ls(host).filter(x => !x.endsWith('.exe') && !x.endsWith('.msg') && x != script).forEach(x => ns.rm(x))
    ns.print('Removed all non-standard files.', 'SUCCESS')

    // download all needed scripts
    //  - request list of required files from api
    //  - download each file
    // kill all scripts running on remote servers
    // loop in background and start scripts when host fulfills requisits
}