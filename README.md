# Flight BD40 · Happy 40th, Cookies 💗

An interactive birthday card, a first-class "flight" from 39 to 40, and the email that delivers it.

- **The card:** `index.html` + `assets/` → https://omarramzi83.github.io/Projbd/
- **The email:** `email/index.html`, with the animated header `email/header.gif`
- **Sending it:** `email/send.html` → https://omarramzi83.github.io/Projbd/email/send.html copies the email so you can paste it into a new Gmail message

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

## Send the email

1. On a computer, open https://omarramzi83.github.io/Projbd/email/send.html and press **Copy the email**.
2. Press **Open Gmail** (the subject is filled in), click into the message and paste.
3. Send it to yourself first, then to her (or use **Schedule send**).

Pasting it in yourself keeps the animated picture and the direct link. A draft made through the Gmail connector loses both: the connector strips images and sends links through a Google "Redirect Notice" page.

## Handy

- Preview a single stop by adding its name to the link, e.g. `…/Projbd/#peacocks`. The names are `seat`, `menu`, `passport`, `peacocks`, `friends`, `level`, `club`, `blessings`, `cake` and `letter`.
- The pet names and signature are set in `CONFIG` at the top of `assets/card.js`.
- Sound effects are all synthesised in the browser. The audio files are her song (`assets/music/cookies-original.mp3`) and the captain's voice (`assets/ai/captain.mp3`).
- `assets/ai/` holds pieces made with Higgsfield: the captain's voice (Seed Audio), the painted postcards, the two paintings and the bouquet (Z-Image). None of them show people's faces.

## BOBZFLIX · Dad's 78th (`bobz/`)

A streaming-app birthday card for Bobz: https://omarramzi83.github.io/Projbd/bobz/

1. **Switch on the TV**, pick a profile (Bobz, Sujooks, Dr. Sadig… or Kids) and watch the trailer (a real voice-over)
2. **Home:** the "BOBZ" billboard, the episode list, Top 10 in Egypt and two BOBZFLIX Originals (the Snapchat videos)
3. **E1 Morning Coffee:** make Turkish coffee, take it off at the perfect foam, read the cup
4. **E2 Dr. Sadig, First Class:** eye chart, Saudi Airlines boarding pass upgrade, a prescription
5. **E3 Officially Egyptian:** stamp the certificate, tick the checklist
6. **E4 Villa Rehab:** live cams of the pool and pergola: waterfall, dolphins, tea with Mom, party mode
7. **E5 Film Tafee!:** rate the films (the tafee button won't let him tafee his own film)
8. **E6 Scam Busters:** scam or legit? WhatsApp safety training
9. **E7 The Good, the Bad & the Back Pain:** a quick-draw duel, and the back massager reveal
10. **E8 Make 78 Great Again:** cheer the rally, then the family WhatsApp group
11. **The Birthday Special:** blow out the 78 candles, the letter, a throwback and the end credits

- Preview a single episode by adding its name to the link, e.g. `…/bobz/#western`. The names are `home`, `coffee`, `doctor`, `masri`, `villa`, `tafee`, `scam`, `western`, `rally` and `special`.
- The sender's name is set in `CONFIG` at the top of `bobz/bobz.js`.
- `bobz/audio/` holds the trailer voice-over and the cowboy line, made with Higgsfield (Seed Audio). Every other sound is synthesised in the browser.
- Send it on WhatsApp: the link shows a BOBZFLIX poster preview (`bobz/og.jpg`).

## Privacy

The repository and the site are public, and both cards live on the same site. Anyone who has a link, or who finds the repository, can see the photos, the videos, the letters and the song. The pages ask search engines not to index them. Location data (GPS) and other metadata were removed from the photos and videos before they were added.
