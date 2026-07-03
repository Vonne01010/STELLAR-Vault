import { Keypair } from "@stellar/stellar-sdk"

const BASE_URL = "http://localhost:3000"

async function main() {
  // 1. Generate a fresh test keypair (throwaway, just for local testing)
  const keypair = Keypair.random()
  const pubkey = keypair.publicKey()

  console.log("Test pubkey:", pubkey)

  // 2. Request a challenge for this pubkey
  const challengeRes = await fetch(`${BASE_URL}/api/auth/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pubkey }),
  })
  const { challenge } = await challengeRes.json()
  console.log("Challenge:", challenge)

  // 3. Sign the challenge with the keypair's private key
  const signatureBuffer = keypair.sign(Buffer.from(challenge, "utf8"))
  const signature = signatureBuffer.toString("base64")

  // 4. Send pubkey + signature to /api/auth/verify
  const verifyRes = await fetch(`${BASE_URL}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pubkey, signature }),
  })
  const verifyData = await verifyRes.json()

  if (!verifyRes.ok) {
    console.error("Verify failed:", verifyData)
    return
  }

  console.log("\n✅ JWT (paste this into Thunder Client's Bearer tab):\n")
  console.log(verifyData.token)
  console.log("\nAssociated pubkey (use this as ownerPubkey when testing):")
  console.log(pubkey)
}

main().catch(console.error)