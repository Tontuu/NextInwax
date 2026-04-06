# NextInWax

A [Spicetify](https://spicetify.app) extension that adds an **Albums** tab to Spotify's queue panel, letting you see which albums are coming up in your queue — including ones you explicitly added and ones detected organically from your listening context.

---

## Features

- **Albums tab** injected directly into the native queue panel
- **Queue tracking** — shows albums explicitly added to the queue
- **Organic detection** — automatically detects albums playing naturally (not via sort) based on the current and next track
- **Playback history** — keeps a record of albums already played, with smart criteria for organic vs. sorted albums
- **Clear queue** — reset your queue at any time with a single button
- **Persistent state** — remembers your last active tab and album history across sessions

---

## Installation

### Requirements

- [Spicetify CLI](https://spicetify.app/docs/getting-started) installed and configured
- Spotify desktop client

### Manual install

1. Download `nextInWax.js` and place it in your Spicetify extensions folder:

```
# macOS / Linux
~/.config/spicetify/Extensions/

# Windows
%appdata%\spicetify\Extensions\
```

2. Run the following commands:

```bash
spicetify config extensions nextInWax.js
spicetify apply
```

---

## How it works

Once installed, open the queue panel in Spotify. You'll see a new **Albums** tab alongside the existing tabs. It shows:

- Albums you added to the queue via the extension
- Albums detected organically from your current listening session

---

## License

MIT
