# Flight BD40 · Happy 40th, Cookies 💗

An interactive birthday card, a first-class "flight" from 39 to 40, and the email that delivers it.

- **The card:** `index.html` + `assets/` → https://omarramzi83.github.io/Projbd/
- **The email:** `email/index.html` (the same HTML as the Gmail draft), with the animated header `email/header.gif`

## The stops on the flight

1. **Boarding:** an envelope, her first-class boarding pass and a *Not Tonight*-style ID check
2. **Seat 1A:** slide up the window shade (fluffy clouds), the caveman captain's announcement (with a real voice clip), her own Suno song on the in-flight entertainment, a spritz of "Eau de Cookies" (pink peony, red rose)
3. **Birthday menu:** satay and laksa (no chilli), a medium-well steak that arrives well done (so it's free) and a buttercream cake
4. **Passport:** stamps for Bali, Hong Kong, London (Loolies & Mayoosh), Lampung and Jakarta, with painted postcards
5. **The peacock porch:** tap the white peacock… and solve the case of the missing squishies
6. **Lampung friends:** feed the turtle, and decide whether to be jealous of the cockatoo
7. **Level 40 unlocked:** her achievements, game style
8. **The 40+ Club:** people who did amazing things at 40 and after
9. **Count your blessings:** tap the clouds, Alhamdulillah
10. **Overcooked: Birthday Edition:** build the cake (with buttercream roses), then blow out the candles (into the mic, or by tapping)
11. **The letter,** a bouquet to unwrap (peonies, red and pink roses, pink tulips, and no white flowers), a hug button, two paintings to keep and little memories

## Turn the website on (one time)

1. Open **Settings → Pages**: https://github.com/omarramzi83/Projbd/settings/pages
2. Under *Build and deployment*, choose **Deploy from a branch**.
3. Pick the branch `claude/interactive-birthday-card-zaeqx9` and the folder `/ (root)`, then **Save**.
4. About a minute later the card is live at https://omarramzi83.github.io/Projbd/

## Handy

- Preview a single stop by adding its name to the link, e.g. `…/Projbd/#peacocks`. The names are `seat`, `menu`, `passport`, `peacocks`, `friends`, `level`, `club`, `blessings`, `cake` and `letter`.
- The pet names and signature are set in `CONFIG` at the top of `assets/card.js`.
- Sound effects are all synthesised in the browser. The audio files are her song (`assets/music/cookies-original.mp3`) and the captain's voice (`assets/ai/captain.mp3`).
- `assets/ai/` holds pieces made with Higgsfield: the captain's voice (Seed Audio), the painted postcards, the two paintings and the bouquet (Z-Image). None of them show people's faces.

## Privacy

The repository and the site are public. Anyone who has the link, or who finds the repository, can see the photos, the letter and the song. The page asks search engines not to index it. The photos' location data (GPS) was removed before they were added.
