# copycast

    Live remote copy-pasta explorer for training sessions

## Use case

Long code workshops (like a few days) can rapidly turn into hell for trainees.

The sessions rhythm is usually quite high and attendees often have a hard time
to follow oral instructions and advices, watch demos on the main screen and
keep coding their projects simultaneously.

After only a few hours, the frustration is quite painful : people tend to give
up because their project gets broken and they can't follow anymore despite the
repeated help of the teacher.

**copycast** was created to fix this situation.

### What's inside?

copycast = [file system watcher](https://github.com/paulmillr/chokidar) + [websocket server](https://github.com/socketio/socket.io) + [reactive webclient](https://github.com/cyclejs)

### Here's how it works )

- At the beginning of the session, the teacher starts *copycast* on its
	machine, watching a specific directory.
- Attendees connect through their browser to the provided local network
	address.
- Their screen displays the directory tree on the left and the selected file on
	the right, like a readonly text-editor.
- Each time the teacher edit and save a file, the change is broadcasted to
	every student who can freely copy-paste snippets to stay up to date.

## Install

```sh
npm i -g copycast
```

## Usage

```
copycast -d YOUR_DIR -p YOUR_PORT
```

Open `localhost:YOUR_PORT` in a web browser

## Dev

To build the client :
```sh
npm i
npm run watch
```

## License

ISC
