# SMP_Playcontrol

A consolidated Spider Monkey Panel transport-control and playback-information panel for foobar2000.

SMP_Playcontrol combines playback controls, seek/volume controls, track information, album artwork, wallpaper, configurable buttons, and Last.fm integration in a single self-contained JavaScript panel.
![image](https://github.com/user-attachments/assets/c18354e5-f536-4dd1-b365-21649329dc37)

## Current Version

**2.0.52**

Version 2.0.52 is the current tested development baseline. It retains generalized foobar2000 Title Formatting evaluation and corrects Last.fm authorization and metadata initialization during playback changes.

## Features

### Playback controls

- Love / Unlove through Last.fm
- Previous Track
- Rewind
- Play / Pause
- Fast Forward
- Next Track
- Playback-order control

### Additional controls

- foobar2000 Preferences
- DSP Preferences
- Facets Search
- Playlist saving
- foo_skip enable / disable

### Track information

- Title
- Artist
- Album
- Elapsed time
- Track length
- Album artwork

### Wallpaper

Album artwork can be used as panel wallpaper, with configurable wallpaper behavior, transparency, and blur.

### Last.fm

The integrated Last.fm functionality supports:

- Last.fm account configuration and authorization
- Love / Unlove
- Loved-track handling
- Importing Last.fm loved tracks
- Displaying tracks marked as loved in the foobar2000 Library

The existing Last.fm configuration and session data are retained by the script. The 2.0.x consolidation does not require re-authorizing an already configured account.

## Requirements

- foobar2000
- Spider Monkey Panel
- foo_skip
- Segoe Fluent Icons for the intended button appearance
- A configured text font; the default is Roboto, with Segoe UI used as the fallback when the configured font is unavailable

![image](https://github.com/user-attachments/assets/d7e99f1d-f1e4-465b-911f-c756b5cdf659)

## Installation

1. Download the current release ZIP.
2. Extract the contents into the appropriate foobar2000 profile location.
3. Add `SMP_Playcontrol.js` to a Spider Monkey Panel.
4. Configure the panel through the SMP Properties dialog.

![image](https://github.com/user-attachments/assets/10a6f8f9-49f6-4e5a-a8e4-9c853f5ec1a5)

## Configuration

PlayControl provides user-configurable properties for:

- Artwork
- Buttons
- Colors
- Panel behavior
- Seekbar
- Text
- Wallpaper

Customized properties can be exported/imported through the normal Spider Monkey Panel property facilities.
![image](https://github.com/user-attachments/assets/83984343-a16c-41f1-9116-d6baf71fb2bf)
![image](https://github.com/user-attachments/assets/8a38d21a-09f7-46ee-8e37-63af601cee59)

## Project Structure

The current project is intentionally small:

```text
SMP_PlayControl/
├── SMP_Playcontrol.js
├── README.md
├── LICENSE
└── .gitignore
```

The JavaScript source is self-contained. Earlier helper, panel, seekbar, volume, album-art, and Last.fm source files have been consolidated into the single `SMP_Playcontrol.js` source file.

## Development

Development follows an incremental approach:

- make one functional or structural change at a time
- test the resulting revision before proceeding
- preserve working behavior while removing obsolete dependencies
- perform performance improvements separately from functional corrections
- keep stable versions available for testing and release

The Git repository preserves the historical project record while the current `main` branch is being brought up to date with the consolidated 2.x implementation.

## Version History

### 2.0.52

- Prevented `EvalWithMetadb()` errors when a track metadata handle is temporarily null.
- Updated metadata initialization and new-track handling so Now Playing text lines 1–3 display after selecting a track in SMP Album Visualizer without requiring Next Track or Previous Track.
- Preserved generalized Title Formatting support introduced in 2.0.50.
- Confirmed the metadata fix works in foobar2000 with Spider Monkey Panel 1.6.1.

### 2.0.51

- Fixed a Last.fm authorization crash caused by an obsolete `panel.list_objects` reference.
- Confirmed Last.fm authorization succeeds in the consolidated implementation.

### 2.0.50

- Generalized Title Formatting evaluation through foobar2000's `EvalWithMetadb()`.
- Supported native Title Formatting functions such as `$max()`, `$min()`, `$if()`, and `$ifgreater()`.
- Retained special `$rgb()` handling for inline text colors.

### 2.0.49

- Corrected initialization ordering for startup panel geometry.
- Retained dynamic playback-state color handling for elapsed/track time.
- Continues the consolidated single-file architecture.

### 2.0.x

The 2.0.x development series consolidated the earlier multi-file PlayControl implementation into a self-contained Spider Monkey Panel script and removed obsolete dependencies and legacy configuration.

### Historical 1.x

The original PlayControl project was based on earlier Spider Monkey Panel work and incorporated functionality from several SMP contributors. The existing Git history contains the historical 1.x development record.

## License

See [LICENSE](LICENSE).
