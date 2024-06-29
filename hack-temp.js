/**
* @param {import("./.project/index").NS } ns 
*/
export async function main(ns) {
	// The target to hack
	const target = ns.args[0]

	// Defines how much money a server should have before it will be hacked:
	const moneyThreshold = ns.getServerMaxMoney(target) * 0.75;

	// Defines the maximum security level the target server can have.
	// If the security level is higher, instead of hacking this will weaken it instead.
	const securityThreshold = ns.getServerMinSecurityLevel(target) + 5;

	// Loop that grows, weakens and hacks the target:
	while (true) {
		if (ns.getServerSecurityLevel(target) > securityThreshold) {
			await ns.weaken(target)
		} else if (ns.getServerMoneyAvailable(target) < moneyThreshold) {
			await ns.grow(target)
		} else {
			await ns.hack(target)
		}
	}
}