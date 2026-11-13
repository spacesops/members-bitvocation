# Your Spaces Name Is Your Membership Card

*Nostr sign-in, Bitcoin-anchored names, and server-enforced access*

**For:** Bitcoin podcasters, Nostr show hosts, and Bitcoin social media creators
**Live demo:** https://bitvocation.timeintosats.com
**Contact:** Andrew Lunde · andrew@lunde.com · https://www.linkedin.com/in/andrewlunde/

---

## The short version

Andrew Lunde built a working members site where **your Bitcoin-anchored Spaces name is your membership card**. You sign in with a Nostr key. The server then checks, against Spaces Protocol relays, which `name@space` handle that key really owns. Access is decided by that answer. There are no passwords, no email signups, and no OAuth providers.

The verification runs on the server, inside the web server's request path. A visitor can't skip it by editing JavaScript or pasting a cookie.

---

## What's new here

**1. Sign in with Nostr, verified by Spaces Protocol.**
Visitors approve the site in a NIP-07 browser extension (keys.band was used for testing). The site never sees a private key. It receives the public key, and a small Rust service asks the Spaces relay network (Fabric / certrelay) which handle, such as `andrew@bitvocation`, is bound to that key. The result is a signed session cookie.

**2. The web server enforces access, not the browser.**
The project uses nginx's `auth_request`. Every protected page or script triggers an internal check against the verification service before nginx serves a single byte. Pages that aren't approved are never sent to the browser.

**3. Access based on namespace.**
Spaces names have structure, and the site uses it. Three tiers are live:

| Tier | Who gets in |
|------|-------------|
| Members | Any key with a verified Spaces handle |
| Namespace-only | Only handles under `@bitvocation` or `@bitcoin` (configurable) |
| Founders | A short allowlist of npubs, which still need a verified handle |

A community that owns a space can say "if you hold a name in our space, you're in." No member database is needed. The Bitcoin-anchored namespace is the roster.

**4. Web servers that understand Spaces names.**
The same nginx fork routes visitors by Spaces handles (`subspace@space`) as well as by ordinary DNS hostnames. One box serves `members@bitvocation` and `bitvocation.timeintosats.com` from the same config.

---

## Why it matters for Bitcoiners

- **Identity you own.** Your handle is anchored to Bitcoin, not rented from a platform that can suspend it.
- **Communities as namespaces.** Owning a space gives a group a native, verifiable membership system.
- **Less data to leak.** The site stores no passwords or emails. The only thing it holds is a short-lived signed cookie.
- **Composable.** Nostr gives the key and Spaces gives the name. Plain nginx does the gating. Each piece is open and replaceable.

---

## Sample interview questions

These are meant to bring out the value of Spaces Protocol names.

1. **"Why not just use a Nostr npub? Why does a name need to be anchored to Bitcoin?"**
   *(Explore: npubs are keys, not names. Spaces names are scarce and hard to fake. You can verify who controls a name without trusting a registrar.)*

2. **"What does `andrew@bitvocation` say that a Twitter handle or an email address doesn't?"**
   *(Explore: proof of control, who can revoke it, and the name being a credential as well as a label.)*

3. **"You gate a page to `@bitvocation` and `@bitcoin` names only. What can a community do once membership is just 'who holds a name in our space'?"**
   *(Explore: no member database, issuing subspace names as membership, portability between sites.)*

4. **"Walk us through what happens between clicking 'Continue with Nostr' and seeing the members page."**
   *(Explore: NIP-07 signing, relay lookup, Fabric verification, the signed cookie, nginx checking each request.)*

5. **"Isn't checking against relays slow? What's the user experience?"**
   *(Explore: honest trade-offs. A first verification can take a while and later visits are cached. The UI shows a live elapsed-seconds counter instead of hiding the wait.)*

6. **"Why enforce access in the web server instead of the app?"**
   *(Explore: client-side gating is cosmetic. `auth_request` means protected bytes never leave the server without a valid check.)*

7. **"Where do DNS names and Spaces names meet? Do people need special software to visit?"**
   *(Explore: the same site answers on `bitvocation.timeintosats.com` and `members@bitvocation`, so Spaces can be adopted gradually.)*

8. **"What would you tell a Bitcoin meetup, podcast, or company that wants this for its own community?"**
   *(Explore: own a space, issue names, point the namespace rule at it.)*

9. **"What's the hardest part you ran into?"**
   *(Explore: making the web server and the verification service agree on who's allowed in, and keeping the wait for verification honest.)*

10. **"Five years out, what does the internet look like if Bitcoin-anchored names become normal?"**
    *(Explore: logins, access lists, and reputation that users carry with them instead of renting from platforms.)*

---

## Assets for show notes

- Demo: https://bitvocation.timeintosats.com
- Code:
  - https://github.com/spacesops/members-bitvocation (site)
  - https://github.com/spacesops/nginx (gateway + `fabric-lookupd`)
- Learn more:
  - Bitvocation: https://bitvocation.com/
  - Spaces explorer: https://explorer.spacesprotocol.org/
  - Spaces wallet: https://spaceswallet.com/
  - SpacesOps: https://spacesops.com/
  - Spaces Protocol White Paper: https://spacesprotocol.org/paper/
- Built on: Spaces Protocol (Fabric / certrelay), Nostr NIP-07, nginx `auth_request`, Rust
- Contact: Andrew Lunde · andrew@lunde.com · https://www.linkedin.com/in/andrewlunde/
