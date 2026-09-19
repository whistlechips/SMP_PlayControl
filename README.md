# SMP_Playcontrol

A consolidated Spider Monkey Panel transport-control and playback-information panel for foobar2000.

SMP_Playcontrol combines playback controls, seek/volume controls, track information, album artwork, wallpaper, configurable buttons, and Last.fm integration in a single self-contained JavaScript panel.

## Current Version

**2.0.50**

Version 2.0.50 is the current tested development baseline. It includes the consolidation of the earlier multi-file PlayControl implementation, subsequent cleanup and performance work, and generalized foobar2000 Title Formatting evaluation.

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

## Installation

1. Download the current release ZIP.
2. Extract the contents into the appropriate foobar2000 profile location.
3. Add `SMP_Playcontrol.js` to a Spider Monkey Panel.
4. Configure the panel through the SMP Properties dialog.

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

### 2.0.50

- Generalized Title Formatting evaluation through foobar2000 `EvalWithMetadb()`.
- Supports the full foobar2000 Title Formatting expression language used by the panel, including functions such as `$max()`, `$min()`, `$if()`, and `$ifgreater()`.
- Retained `$rgb()` support for inline color changes within configurable text expressions.
- Tested with Title Formatting expressions combining standard fields, conditional expressions, and `$rgb()` color controls.

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
