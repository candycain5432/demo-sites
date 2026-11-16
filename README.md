# Demo Sites

Three demo websites to show prospective clients, plus a landing page (`index.html`) that links to all of them.
Everything is plain static HTML/CSS/JS. There's no build step and no server, so it can be hosted anywhere (GitHub Pages, Netlify, etc.).

| Demo | Folder | For clients like… | Interactive features |
|---|---|---|---|
| **Smoke & Salsa** | `food-truck/` | Food trucks, restaurants, cafés | Menu with categories, item customization, cart, checkout, live order tracker, weekly location schedule (highlights today), catering estimate calculator |
| **Grace Harbor Church** | `church/` | Churches, ministries, nonprofits | Live countdown to next service, "Plan a Visit" form, searchable sermon library with audio player, events with RSVP, prayer wall & requests, online giving with fundraising goal |
| **Oak & Iron Barber Co.** | `barbershop/` | Barbers, salons, any appointment-based business | 4-step booking (service → barber → date/time → details), per-barber availability, add-to-calendar (.ics), manage/cancel appointment, membership plans, live "open now" hours |

## Notes
- All orders, bookings, and forms are **simulated**. Nothing is sent anywhere. A small badge on every page says so.
- Carts, RSVPs and bookings are saved in the visitor's browser (localStorage) so the demos feel real when clicking around.
- Dates (schedule, events, open hours, booking calendar) are computed from today's date, so the demos never look stale.
- No photos are used, so there are no licensing concerns. Swap in a client's real photos when customizing.

## Preview locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Customizing
Replace "Hometown Web Studio" and the `mailto:` link in `index.html` with your business name and email.
