import { find_nodes, find_path } from '/util/network-utils.js'

/**
* @param {import("./.project/index").NS } ns 
*/
export async function main(ns) {
    var test = (find_path(ns, 'I.I.I.I').map(x => (x == 'home' ? '' : 'connect ') + x).join(';'))
    ns.tprint(test)
}

// lol