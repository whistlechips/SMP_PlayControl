'use strict';

window.DefineScript('PlayControl', {
  author: 'TheQwertiest / @marc2003 / @Br3tt / T.P Wang / whistlechips / OpenAI',
  version: '2.0.50',
  options: {
    grab_focus: true
  }
});

// ============================================================================
// PlayControl helpers
// ============================================================================


// -----------------------------------------------------------------------------
// PlayControl helper support state.
// -----------------------------------------------------------------------------
let WshShell = new ActiveXObject('WScript.Shell');

const DT_LEFT = 0x00000000;
const DT_RIGHT = 0x00000002;
const DT_VCENTER = 0x00000004;
const DT_CALCRECT = 0x00000400;
const DT_NOPREFIX = 0x00000800;
const DT_END_ELLIPSIS = 0x00008000;

const SF_CENTRE = 285212672;


const MF_STRING = 0x00000000;
const MF_GRAYED = 0x00000001;



const N = window.ScriptInfo.Name + ':';

let DPI = 96;
try { DPI = WshShell.RegRead('HKCU\\Control Panel\\Desktop\\WindowMetrics\\AppliedDPI'); } catch (e) {}


const configuredFont = window.GetProperty('TEXT: Font', 'Roboto');
const fontName = utils.CheckFont(configuredFont) ? configuredFont : 'Segoe UI';
const tooltip_fsize = window.GetProperty('TEXT: Font Size Tooltip', 7);

let tooltip = window.CreateTooltip(fontName, _scale(tooltip_fsize));
tooltip.SetMaxWidth(1200);

const folders = {
    data: fb.ProfilePath + 'js_data\\PlayControl\\'
};

const image = {
    crop: 0,
    crop_top: 1,
    stretch: 2,
    centre: 3
};



// ============================================================================
// PlayControl helpers
// PlayControl utility functions.
// ============================================================================

// -----------------------------------------------------------------------------
// Core helper functions required by PlayControl.
// -----------------------------------------------------------------------------
// The generic helpers.js sample contains many unrelated utilities. Only the
// functions required by PlayControl, the consolidated panel, and controls are
// retained here.
// -----------------------------------------------------------------------------
//
// _help() was replaced with the Help/Resources menu developed for the
// SMP Album Visualizer.
// -----------------------------------------------------------------------------
function _button(x, y, w, h, img_src, fn, tiptext) {
	this.paint = (gr) => {
		if (this.img) {
			_drawImage(gr, this.img, this.x, this.y, this.w, this.h);
		}
	}
		
	this.trace = (x, y) => {
		return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
	}
	
	this.lbtn_up = (x, y, mask) => {
		if (this.fn) {
			this.fn(x, y, mask);
		}
	}
	
	this.cs = (s) => {
		if (s == 'hover') {
			this.img = this.img_hover;
			_tt(this.tiptext);
		} else {
			this.img = this.img_normal;
		}
		window.RepaintRect(this.x, this.y, this.w, this.h);
	}
	
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.fn = fn;
	this.tiptext = tiptext;
	this.img_normal = typeof img_src.normal == 'string' ? _img(img_src.normal) : img_src.normal;
	this.img_hover = img_src.hover ? (typeof img_src.hover == 'string' ? _img(img_src.hover) : img_src.hover) : this.img_normal;
	this.img = this.img_normal;
}

function _buttons() {
	this.paint = (gr) => {
		for (let i in this.buttons) {
			let button = this.buttons[i];
			if (!button) continue;
			if (i == 'play') continue;
			button.paint(gr);
		}

		let play = this.buttons.play;
		if (play) {
			let overPlay =
				mouse.x >= play.x &&
				mouse.x <= play.x + play.w &&
				mouse.y >= play.y &&
				mouse.y <= play.y + play.h;

			// Hover takes priority over the blink phase.
			let playImg = overPlay
				? play.img_hover
				: ((fb.IsPlaying && !fb.IsPaused && playBlinkPhase)
					? play.img_hover
					: play.img_normal);

			_drawImage(gr, playImg, play.x, play.y, play.w, play.h);
		}
	}
	
	this.move = (x, y) => {
		let temp_btn = null;
		for (let i in this.buttons) {
			if (this.buttons[i] && this.buttons[i].trace(x, y)) {
				temp_btn = i;
			}
		}
		if (this.btn == temp_btn) {
			return this.btn;
		}
		if (this.btn) {
			this.buttons[this.btn].cs('normal');
		}
		if (temp_btn) {
			this.buttons[temp_btn].cs('hover');
		} else {
			_tt('');
		}
		this.btn = temp_btn;
		return this.btn;
	}
	
	this.leave = () => {
		if (this.btn) {
			_tt('');
			this.buttons[this.btn].cs('normal');
		}
		this.btn = null;
	}
	
	this.lbtn_up = (x, y, mask) => {
		if (this.btn) {
			this.buttons[this.btn].lbtn_up(x, y, mask);
			return true;
		} else {
			return false;
		}
	}
	
	this.buttons = {};
	this.btn = null;
}

function _cc(name) {
	return utils.CheckComponent(name, true);
}

function _drawImage(gr, img, src_x, src_y, src_w, src_h, aspect, border, alpha) {
	if (!img) {
		return [];
	}
	gr.SetInterpolationMode(7);
	let dst_x, dst_y, dst_w, dst_h;
	switch (aspect) {
	case image.crop:
	case image.crop_top:
		if (img.Width / img.Height < src_w / src_h) {
			dst_w = img.Width;
			dst_h = Math.round(src_h * img.Width / src_w);
			dst_x = 0;
			dst_y = Math.round((img.Height - dst_h) / (aspect == image.crop_top ? 4 : 2));
		} else {
			dst_w = Math.round(src_w * img.Height / src_h);
			dst_h = img.Height;
			dst_x = Math.round((img.Width - dst_w) / 2);
			dst_y = 0;
		}
		gr.DrawImage(img, src_x, src_y, src_w, src_h, dst_x + 3, dst_y + 3, dst_w - 6, dst_h - 6, 0, alpha || 255);
		break;
	case image.stretch:
		gr.DrawImage(img, src_x, src_y, src_w, src_h, 0, 0, img.Width, img.Height, 0, alpha || 255);
		break;
	case image.centre:
	default:
		const s = Math.min(src_w / img.Width, src_h / img.Height);
		const w = Math.floor(img.Width * s);
		const h = Math.floor(img.Height * s);
		src_x += Math.round((src_w - w) / 2);
		src_y += Math.round((src_h - h) / 2);
		src_w = w;
		src_h = h;
		dst_x = 0;
		dst_y = 0;
		dst_w = img.Width;
		dst_h = img.Height;
		gr.DrawImage(img, src_x, src_y, src_w, src_h, dst_x, dst_y, dst_w, dst_h, 0, alpha || 255);
		break;
	}
	if (border) {
		gr.DrawRect(src_x, src_y, src_w - 1, src_h - 1, 1, border);
	}
	return [src_x, src_y, src_w, src_h];
}

function _gdiFont(name, size, style) {
	return gdi.Font(name, _scale(size), style);
}

function _jsonParse(value) {
	try {
		let data = JSON.parse(value);
		return data;
	} catch (e) {
		return [];
	}
}

function _help(x, y, flags) {
	let m = window.CreatePopupMenu();

	m.AppendMenuItem(MF_STRING, 100, 'Spider Monkey Panel Documentation');
	m.AppendMenuItem(MF_STRING, 101, 'Title Formatting Reference');
	m.AppendMenuItem(MF_STRING, 102, 'Query Syntax');
	m.AppendMenuSeparator();
	m.AppendMenuItem(MF_STRING, 103, 'foobar2000 Homepage');
	m.AppendMenuItem(MF_STRING, 104, 'Components');
	m.AppendMenuItem(MF_STRING, 105, 'Wiki');
	m.AppendMenuItem(MF_STRING, 106, 'Forums');
	m.AppendMenuSeparator();
	m.AppendMenuItem(MF_STRING, 1, 'Reload');
	m.AppendMenuItem(MF_STRING, 2, 'Open component folder');
	m.AppendMenuItem(MF_STRING, 3, 'Panel properties...');
	m.AppendMenuItem(MF_STRING, 4, 'Configure...');

	let idx = m.TrackPopupMenu(x, y, flags);

	switch (idx) {
	case 1:
		window.Reload();
		break;
	case 2:
		WshShell.Run('explorer.exe "' + fb.ComponentPath + '"');
		break;
	case 3:
		window.ShowProperties();
		break;
	case 4:
		window.ShowConfigure();
		break;
	case 100:
		WshShell.Run('"https://theqwertiest.github.io/foo_spider_monkey_panel/assets/generated_files/docs/html/"');
		break;
	case 101:
		WshShell.Run('"https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Title_Formatting_Reference"');
		break;
	case 102:
		WshShell.Run('"https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Query_syntax"');
		break;
	case 103:
		WshShell.Run('"https://www.foobar2000.org/"');
		break;
	case 104:
		WshShell.Run('"https://www.foobar2000.org/components"');
		break;
	case 105:
		WshShell.Run('"https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Foobar2000"');
		break;
	case 106:
		WshShell.Run('"https://hydrogenaud.io/index.php/board,28.0.html"');
		break;
	}
}

function _RGBA(r, g, b, a) {
	return a << 24 | r << 16 | g << 8 | b;
}

function _scale(size) {
	return Math.round(size * DPI / 72);
}

// -----------------------------------------------------------------------------
// Last.fm helper retained from helpers.js.
// -----------------------------------------------------------------------------
function _q(value) {
	return '"' + value + '"';
}

function _run() {
	try {
		WshShell.Run(Array.prototype.map.call(arguments, _q).join(' '));
		return true;
	} catch (e) {
		return false;
	}
}

function _tagged(value) {
	return value != '' && value != '?';
}

function _tt(value) {
	if (tooltip.Text != value) {
		tooltip.Text = value;
		tooltip.Activate();
	}
}


function _lastfm() {
	this.notify_data = (name, data) => {
		if (name == '2K3.NOTIFY.LASTFM') {
			this.username = this.read_ini('username');
			this.sk = this.read_ini('sk');
			if (typeof buttons == 'object' && typeof buttons.update == 'function') {
				buttons.update();
				window.Repaint();
			}
			panel.list_objects.forEach((item) => {
				if (item.mode == 'lastfm_info' && item.properties.mode.value > 0) {
					item.update();
				}
			});
		}
	}
	
	this.post = (method, token, metadb) => {
		let api_sig, data;
		switch (method) {
		case 'auth.getToken':
			this.update_sk('');
			api_sig = md5('api_key' + this.api_key + 'method' + method + this.secret);
			data = 'format=json&method=' + method + '&api_key=' + this.api_key + '&api_sig=' + api_sig;
			break;
		case 'auth.getSession':
			api_sig = md5('api_key' + this.api_key + 'method' + method + 'token' + token + this.secret);
			data = 'format=json&method=' + method + '&api_key=' + this.api_key + '&api_sig=' + api_sig + '&token=' + token;
			break;
		case 'track.love':
		case 'track.unlove':
			switch (true) {
			case !this.username.length:
				return console.log(N, 'Last.fm username not set.');
			case this.sk.length != 32:
				return console.log(N, 'This script has not been authorised.');
			}
			const artist = this.tfo.artist.EvalWithMetadb(metadb);
			const track = this.tfo.title.EvalWithMetadb(metadb);
			if (!_tagged(artist) || !_tagged(track)) {
				return;
			}
			console.log(N, 'Attempting to ' + (method == 'track.love' ? 'love ' : 'unlove ') + _q(track) + ' by ' + _q(artist));
			console.log(N, 'Contacting Last.fm....');
			api_sig = md5('api_key' + this.api_key + 'artist' + artist + 'method' + method + 'sk' + this.sk + 'track' + track + this.secret);
			// can't use format=json because Last.fm API is broken for this method
			data = 'method=' + method + '&api_key=' + this.api_key + '&api_sig=' + api_sig + '&sk=' + this.sk + '&artist=' + encodeURIComponent(artist) + '&track=' + encodeURIComponent(track);
			break;
		default:
			return;
		}
		this.xmlhttp.open('POST', 'https://ws.audioscrobbler.com/2.0/', true);
		this.xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		this.xmlhttp.setRequestHeader('User-Agent', this.ua);
		this.xmlhttp.send(data);
		this.xmlhttp.onreadystatechange = () => {
			if (this.xmlhttp.readyState == 4) {
				this.done(method, metadb);
			}
		}
	}
	
	this.get_loved_tracks = (p) => {
		if (!this.username.length) {
			return console.log(N, 'Last.fm Username not set.');
		}
		this.page = p;
		const url = this.get_base_url() + '&method=user.getLovedTracks&limit=200&user=' + this.username + '&page=' + this.page;
		this.xmlhttp.open('GET', url, true);
		this.xmlhttp.setRequestHeader('User-Agent', this.ua);
		this.xmlhttp.setRequestHeader('If-Modified-Since', 'Thu, 01 Jan 1970 00:00:00 GMT');
		this.xmlhttp.send();
		this.xmlhttp.onreadystatechange = () => {
			if (this.xmlhttp.readyState == 4) {
				this.done('user.getLovedTracks');
			}
		}
	}
	
	this.done = (method, metadb) => {
		let data
		switch (method) {
		case 'user.getLovedTracks':
			data = _jsonParse(this.xmlhttp.responseText);
			if (this.page == 1) {
				fb.ShowConsole();
				if (data.error) {
					return console.log(N, 'Last.fm server error:', data.message);
				}
				this.loved_tracks = [];
				this.pages = (data.lovedtracks && data.lovedtracks['@attr'] && data.lovedtracks['@attr'].totalPages) || 0;
			}
			data = (data.lovedtracks && data.lovedtracks.track) || [];
			if (data.length) {
				this.loved_tracks = [...this.loved_tracks, ...(data.map((item) => {
					const artist = item.artist.name.toLowerCase();
					const title = item.name.toLowerCase();
					return artist + ' - ' + title;
				}))];
				console.log('Loved tracks: completed page', this.page, 'of', this.pages);
			}
			if (this.page < this.pages) {
				this.page++;
				this.get_loved_tracks(this.page);
			} else {
				console.log(this.loved_tracks.length, 'loved tracks were found on Last.fm.');
				let items = fb.GetLibraryItems();
				items.OrderByFormat(this.tfo.key, 1);
				let items_to_refresh = new FbMetadbHandleList();
				for (let i = 0; i < items.Count; i++) {
					let m = items[i];
					let current = this.tfo.key.EvalWithMetadb(m);
					let idx = this.loved_tracks.indexOf(current);
					if (idx > -1) {
						this.loved_tracks.splice(idx, 1);
						m.SetLoved(1);
						items_to_refresh.Add(m);
					}
				}
				console.log(items_to_refresh.Count, 'library tracks matched and updated. Duplicates are not counted.');
				console.log('For those updated tracks, %SMP_LOVED% now has the value of 1 in all components/search dialogs.');
				if (this.loved_tracks.length) {
					console.log('The following tracks were not matched:');
					this.loved_tracks.forEach((item) => {
						console.log(item);
					});
				}
				items_to_refresh.RefreshStats();
			}
			return;
		case 'track.love':
			if (this.xmlhttp.responseText.includes('ok')) {
				console.log(N, 'Track loved successfully.');
				metadb.SetLoved(1);
				metadb.RefreshStats();
				return;
			}
			break;
		case 'track.unlove':
			if (this.xmlhttp.responseText.includes('ok')) {
				console.log(N, 'Track unloved successfully.');
				metadb.SetLoved(0);
				metadb.RefreshStats();
				return;
			}
			break;
		case 'auth.getToken':
			data = _jsonParse(this.xmlhttp.responseText);
			if (data.token) {
				_run('https://last.fm/api/auth/?api_key=' + this.api_key + '&token=' + data.token);
				if (WshShell.Popup('If you granted permission successfully, click Yes to continue.', 0, window.ScriptInfo.Name, 32 + 4) == 6) {
					this.post('auth.getSession', data.token);
				}
				return;
			}
			break;
		case 'auth.getSession':
			data = _jsonParse(this.xmlhttp.responseText);
			if (data.session && data.session.key) {
				this.update_sk(data.session.key);
				return;
			}
			break;
		}
		// display response text/error if we get here, any success returned early
		console.log(N, this.xmlhttp.responseText || this.xmlhttp.status);
	}
	
	this.update_username = () => {
		const username = utils.InputBox(window.ID, 'Enter your Last.fm username', window.ScriptInfo.Name, this.username);
		if (username != this.username) {
			this.write_ini('username', username);
			this.update_sk('');
		}
	}
	
	this.get_base_url = () => {
		return 'http://ws.audioscrobbler.com/2.0/?format=json&api_key=' + this.api_key;
	}
	
	this.read_ini = (k) => {
		return utils.ReadINI(this.ini_file, 'Last.fm', k);
	}
	
	this.write_ini = (k, v) => {
		utils.WriteINI(this.ini_file, 'Last.fm', k, v);
	}
	
	this.update_sk = (sk) => {
		this.write_ini('sk', sk);
		window.NotifyOthers('2K3.NOTIFY.LASTFM', 'update');
		this.notify_data('2K3.NOTIFY.LASTFM', 'update');
	}
	
	this.tfo = {
		key : fb.TitleFormat('$lower(%artist% - %title%)'),
		artist : fb.TitleFormat('%artist%'),
		title : fb.TitleFormat('%title%'),
		album : fb.TitleFormat('[%album%]'),
		loved : fb.TitleFormat('$if2(%SMP_LOVED%,0)'),
		playcount : fb.TitleFormat('$if2(%SMP_PLAYCOUNT%,0)'),
		first_played : fb.TitleFormat('%SMP_FIRST_PLAYED%')
	};
	
	_createFolder(folders.data);
	this.ini_file = folders.data + 'lastfm.ini';
    this.legacy_ini_file = fb.ProfilePath + 'js_data\\lastfm.ini';
    if (this.legacy_ini_file !== this.ini_file &&
        utils.FileExists(this.legacy_ini_file) &&
        !utils.FileExists(this.ini_file)) {
        try {
            utils.CopyFile(this.legacy_ini_file, this.ini_file);
        } catch (e) {}
    }
	this.api_key = '138423824920df7385a220dc05efe196';
	this.secret = 'b21edf626b8802e7fb1797e74ff8e943';
	this.username = this.read_ini('username');
	this.sk = this.read_ini('sk');
	this.ua = 'foo_jscript_panel_lastfm2';
	this.xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
}

/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
let hexcase=0;function md5(a){return rstr2hex(rstr_md5(str2rstr_utf8(a)))}
function rstr_md5(a){return binl2rstr(binl_md5(rstr2binl(a),a.length*8))}
function rstr2hex(c){try{hexcase}catch(g){hexcase=0}
let f=hexcase?'0123456789ABCDEF':'0123456789abcdef';let b='';let a;for(let d=0;d<c.length;d++){a=c.charCodeAt(d);b+=f.charAt((a>>>4)&15)+f.charAt(a&15)}
return b}
function str2rstr_utf8(c){let b='';let d=-1;let a,e;while(++d<c.length){a=c.charCodeAt(d);e=d+1<c.length?c.charCodeAt(d+1):0;if(55296<=a&&a<=56319&&56320<=e&&e<=57343){a=65536+((a&1023)<<10)+(e&1023);d++}
if(a<=127){b+=String.fromCharCode(a)}else{if(a<=2047){b+=String.fromCharCode(192|((a>>>6)&31),128|(a&63))}else{if(a<=65535){b+=String.fromCharCode(224|((a>>>12)&15),128|((a>>>6)&63),128|(a&63))}else{if(a<=2097151){b+=String.fromCharCode(240|((a>>>18)&7),128|((a>>>12)&63),128|((a>>>6)&63),128|(a&63))}}}}}
return b}
function rstr2binl(b){let a=Array(b.length>>2);for(let c=0;c<a.length;c++){a[c]=0}
for(let c=0;c<b.length*8;c+=8){a[c>>5]|=(b.charCodeAt(c/8)&255)<<(c%32)}
return a}
function binl2rstr(b){let a='';for(let c=0;c<b.length*32;c+=8){a+=String.fromCharCode((b[c>>5]>>>(c%32))&255)}
return a}
function binl_md5(p,k){p[k>>5]|=128<<((k)%32);p[(((k+64)>>>9)<<4)+14]=k;let o=1732584193;let n=-271733879;let m=-1732584194;let l=271733878;for(let g=0;g<p.length;g+=16){let j=o;let h=n;let f=m;let e=l;o=md5_ff(o,n,m,l,p[g+0],7,-680876936);l=md5_ff(l,o,n,m,p[g+1],12,-389564586);m=md5_ff(m,l,o,n,p[g+2],17,606105819);n=md5_ff(n,m,l,o,p[g+3],22,-1044525330);o=md5_ff(o,n,m,l,p[g+4],7,-176418897);l=md5_ff(l,o,n,m,p[g+5],12,1200080426);m=md5_ff(m,l,o,n,p[g+6],17,-1473231341);n=md5_ff(n,m,l,o,p[g+7],22,-45705983);o=md5_ff(o,n,m,l,p[g+8],7,1770035416);l=md5_ff(l,o,n,m,p[g+9],12,-1958414417);m=md5_ff(m,l,o,n,p[g+10],17,-42063);n=md5_ff(n,m,l,o,p[g+11],22,-1990404162);o=md5_ff(o,n,m,l,p[g+12],7,1804603682);l=md5_ff(l,o,n,m,p[g+13],12,-40341101);m=md5_ff(m,l,o,n,p[g+14],17,-1502002290);n=md5_ff(n,m,l,o,p[g+15],22,1236535329);o=md5_gg(o,n,m,l,p[g+1],5,-165796510);l=md5_gg(l,o,n,m,p[g+6],9,-1069501632);m=md5_gg(m,l,o,n,p[g+11],14,643717713);n=md5_gg(n,m,l,o,p[g+0],20,-373897302);o=md5_gg(o,n,m,l,p[g+5],5,-701558691);l=md5_gg(l,o,n,m,p[g+10],9,38016083);m=md5_gg(m,l,o,n,p[g+15],14,-660478335);n=md5_gg(n,m,l,o,p[g+4],20,-405537848);o=md5_gg(o,n,m,l,p[g+9],5,568446438);l=md5_gg(l,o,n,m,p[g+14],9,-1019803690);m=md5_gg(m,l,o,n,p[g+3],14,-187363961);n=md5_gg(n,m,l,o,p[g+8],20,1163531501);o=md5_gg(o,n,m,l,p[g+13],5,-1444681467);l=md5_gg(l,o,n,m,p[g+2],9,-51403784);m=md5_gg(m,l,o,n,p[g+7],14,1735328473);n=md5_gg(n,m,l,o,p[g+12],20,-1926607734);o=md5_hh(o,n,m,l,p[g+5],4,-378558);l=md5_hh(l,o,n,m,p[g+8],11,-2022574463);m=md5_hh(m,l,o,n,p[g+11],16,1839030562);n=md5_hh(n,m,l,o,p[g+14],23,-35309556);o=md5_hh(o,n,m,l,p[g+1],4,-1530992060);l=md5_hh(l,o,n,m,p[g+4],11,1272893353);m=md5_hh(m,l,o,n,p[g+7],16,-155497632);n=md5_hh(n,m,l,o,p[g+10],23,-1094730640);o=md5_hh(o,n,m,l,p[g+13],4,681279174);l=md5_hh(l,o,n,m,p[g+0],11,-358537222);m=md5_hh(m,l,o,n,p[g+3],16,-722521979);n=md5_hh(n,m,l,o,p[g+6],23,76029189);o=md5_hh(o,n,m,l,p[g+9],4,-640364487);l=md5_hh(l,o,n,m,p[g+12],11,-421815835);m=md5_hh(m,l,o,n,p[g+15],16,530742520);n=md5_hh(n,m,l,o,p[g+2],23,-995338651);o=md5_ii(o,n,m,l,p[g+0],6,-198630844);l=md5_ii(l,o,n,m,p[g+7],10,1126891415);m=md5_ii(m,l,o,n,p[g+14],15,-1416354905);n=md5_ii(n,m,l,o,p[g+5],21,-57434055);o=md5_ii(o,n,m,l,p[g+12],6,1700485571);l=md5_ii(l,o,n,m,p[g+3],10,-1894986606);m=md5_ii(m,l,o,n,p[g+10],15,-1051523);n=md5_ii(n,m,l,o,p[g+1],21,-2054922799);o=md5_ii(o,n,m,l,p[g+8],6,1873313359);l=md5_ii(l,o,n,m,p[g+15],10,-30611744);m=md5_ii(m,l,o,n,p[g+6],15,-1560198380);n=md5_ii(n,m,l,o,p[g+13],21,1309151649);o=md5_ii(o,n,m,l,p[g+4],6,-145523070);l=md5_ii(l,o,n,m,p[g+11],10,-1120210379);m=md5_ii(m,l,o,n,p[g+2],15,718787259);n=md5_ii(n,m,l,o,p[g+9],21,-343485551);o=safe_add(o,j);n=safe_add(n,h);m=safe_add(m,f);l=safe_add(l,e)}
return Array(o,n,m,l)}
function md5_cmn(h,e,d,c,g,f){return safe_add(bit_rol(safe_add(safe_add(e,h),safe_add(c,f)),g),d)}
function md5_ff(g,f,k,j,e,i,h){return md5_cmn((f&k)|((~f)&j),g,f,e,i,h)}
function md5_gg(g,f,k,j,e,i,h){return md5_cmn((f&j)|(k&(~j)),g,f,e,i,h)}
function md5_hh(g,f,k,j,e,i,h){return md5_cmn(f^k^j,g,f,e,i,h)}
function md5_ii(g,f,k,j,e,i,h){return md5_cmn(k^(f|(~j)),g,f,e,i,h)}
function safe_add(a,d){let c=(a&65535)+(d&65535);let b=(a>>16)+(d>>16)+(c>>16);return(b<<16)|(c&65535)}
function bit_rol(a,b){return(a<<b)|(a>>>(32-b))}



// -----------------------------------------------------------------------------
// _chrToImg improvements â€” 6/18/2025. 
// -----------------------------------------------------------------------------
//   try...finally ensures graphics context is always released (SpiderMonkey doesnâ€™t do GC for GDI handles).
//   Fallback for size using size = size || 96; (works in SpiderMonkey safely).
//   Avoids arrow functions or ES6+ syntax, sticking to the classic, reliable subset.
// -----------------------------------------------------------------------------
function _chrToImg(chr, colour, font, size) {
  size = size || 96;

  if (!chr || typeof chr !== 'string') return null;

  const bmp = gdi.CreateImage(size, size);
  if (!bmp) return null;

  const gr = bmp.GetGraphics();
  try {
    gr.SetTextRenderingHint(4); // ClearType
    gr.DrawString(chr, font || fluent, colour, 0, 0, size, size, SF_CENTRE);
  } finally {
    bmp.ReleaseGraphics(gr);
  }

  return bmp;
}


// -----------------------------------------------------------------------------
// make_rgb() improvements â€” 07/06/2025.
// -----------------------------------------------------------------------------
//    RGB(A) comma-separated strings like "255,128,64" or "255,128,64,128"
//    Hex color strings like "#FF8040", "FF8040", or even short format "#F83"
//    Updated to use both Hyphen and Comma-separated formats --- 3/4/2026
// -----------------------------------------------------------------------------
function make_rgb(a) {
  if (typeof a !== 'string') return null;

  a = a.trim();

  // --- HEX Format ---
  if (a[0] === '#') a = a.slice(1);

  if (/^#[0-9a-fA-F]{3}$/.test(a)) {
    // Expand shorthand hex (#f83 â†’ #ff8833)
    a = '#' + a.slice(1).split('').map(ch => ch + ch).join('');
  }

  if (/^[0-9a-fA-F]{6}$/.test(a)) {
    const r = parseInt(a.slice(0, 2), 16);
    const g = parseInt(a.slice(2, 4), 16);
    const b = parseInt(a.slice(4, 6), 16);
    return _RGBA(r, g, b, 255);
  }

	// --- Updated to use both Hyphen and Comma-separated formats ---
	const parts = a
		.split(a.includes('-') ? '-' : ',')
		.map((part, i) => {
			const val = parseInt(part.trim(), 10) || 0;
			return Math.max(0, Math.min(255, val));
		});
		
		if (parts.length < 3) return null;

		const [r, g, b, alpha] = parts;

		return _RGBA(r, g, b, alpha === undefined ? 255 : Number(alpha));
};
  

// -----------------------------------------------------------------------------
// objects for text elements and their assignments
// -----------------------------------------------------------------------------
function tfo(tf, fsize, style, source) {
    this.tf = tf;
    this.fsize = fsize;
    this.style = style;
    this.source = source || '';
    this.rgbParts = null;

    // Evaluate a Title Formatting expression through foobar2000.
    // EvalWithMetadb() allows the complete foobar2000 TF language to be
    // processed, including $max(), $min(), $if(), $ifgreater(), etc.
    this.eval = function (tf) {
        if (!tf) return '';
        return tf.EvalWithMetadb(panel.metadb);
    };

    // Parse only $rgb(r,g,b) / $rgb() color controls.
    // Everything between color controls remains a complete foobar2000
    // Title Formatting expression and is evaluated by fb.TitleFormat().
    if (/\$rgb\s*\(/i.test(this.source)) {
        const re = /\$rgb\s*\(\s*(?:(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3}))?\s*\)/gi;
        let last = 0;
        let match;

        this.rgbParts = [];

        while ((match = re.exec(this.source)) !== null) {
            if (match.index > last) {
                this.rgbParts.push({
                    tf: fb.TitleFormat(this.source.substring(last, match.index)),
                    color: null
                });
            }

            this.rgbParts.push({
                tf: null,
                color: match[1] === undefined
                    ? null
                    : _RGBA(
                        Math.min(255, Number(match[1])),
                        Math.min(255, Number(match[2])),
                        Math.min(255, Number(match[3])),
                        255
                    )
            });

            last = re.lastIndex;
        }

        if (last < this.source.length) {
            this.rgbParts.push({
                tf: fb.TitleFormat(this.source.substring(last)),
                color: null
            });
        }

        if (!this.rgbParts.length) {
            this.rgbParts = null;
        }
    }

    this.font = function () {
        return _gdiFont(fontName, this.fsize, this.style);
    };

    this.h = function () {
        return this.font().Height * 1.2;
    };

    this.draw = function (gr, baseColor, x, y, w, h, flags) {
        if (!this.rgbParts) {
            gr.GdiDrawText(
                this.eval(this.tf),
                this.font(),
                baseColor,
                x, y, w, h,
                flags
            );
            return;
        }

        const font = this.font();
        let drawX = x;
        let activeColor = baseColor;
        const end = x + w;

        for (let i = 0; i < this.rgbParts.length; i++) {
            const part = this.rgbParts[i];

            if (part.tf === null) {
                activeColor = part.color === null
                    ? baseColor
                    : part.color;
                continue;
            }

            const value = this.eval(part.tf);

            if (!value || drawX >= end) {
                continue;
            }

            const partW = gr.CalcTextWidth(value, font);
            const remaining = end - drawX;

            if (partW <= remaining) {
                gr.GdiDrawText(
                    value,
                    font,
                    activeColor,
                    drawX, y, partW, h,
                    DT_LEFT | DT_VCENTER | DT_NOPREFIX
                );

                drawX += partW;
            } else {
                gr.GdiDrawText(
                    value,
                    font,
                    activeColor,
                    drawX, y, remaining, h,
                    DT_LEFT | DT_VCENTER | DT_NOPREFIX | DT_END_ELLIPSIS
                );

                break;
            }
        }
    };
}

// -----------------------------------------------------------------------------
;

// -----------------------------------------------------------------------------
// Button constructor/prototype improvements â€” 6/18/2025.
// -----------------------------------------------------------------------------
//  Replacing this.x = function() {} style methods with prototype methods (more efficient memory usage).
//  Using let instead of let/const to match SpiderMonkeyâ€™s supported ES version.
//  Simplifying ternaries and avoiding unnecessary dynamic functions or chains.
//  Ensuring compatibility with SpiderMonkeyâ€™s limited ES5.1 support.
// -----------------------------------------------------------------------------
function make_button(b) {
	buttons.buttons[b.d] = new _button(
		b.x(), b.y(), b.z(), b.z(),
		{ normal: b.n, hover: b.h },
		b.f, b.t
	);
}

function btn(c, d, n, h, t, f, e) {
	this.c = c; // index
	this.d = d; // designator
	this.n = n; // normal icon/char
	this.h = h; // hover icon/char
	this.t = t; // tooltip
	this.f = f; // action/functionality
	this.e = e; // base x position for first button
};

btn.prototype.x = function () {
  if (this.d == 'play')
    return this.e + (bs * this.c) - (bs / 4);
  if (this.d == 'volume')
    return volbar.x - bs;
  return this.e + (bs * this.c);
};

btn.prototype.y = function () {
  if (this.d == 'play')
    return (seekbar.y + seekbar.h + _scale(4)) - (bs * 0.25);
  if (this.d == 'volume')
    return volbar.y - ((bs - volbar.h) / 2);
  return seekbar.y + seekbar.h + _scale(4);
};

btn.prototype.z = function () {             // button size
  return this.d == 'play' ? bs * 1.5 : bs;  // play/pause button 1.5 times size of others
};


// -----------------------------------------------------------------------------
// | 07/06/2025: Combined Shortcut and Transport button background and border settings into one.
// |             Renamed function to better reflect purpose.
// -----------------------------------------------------------------------------
function drawButtonsBgBorder(gr) {
  const bgColor = colors.ButtonBackground;
  const borderColor = colors.Border;

  if (ppt.btn_bg) {
    try {
      gr.FillRoundRect(pb_bg.x, pb_bg.y(), pb_bg.w, pb_bg.h(), arc.bg, arc.bg, bgColor);
    } catch (e) {
      console.log("Error in FillRoundRect for pb_bg:", e);
    }

    try {
      gr.FillRoundRect(short_bg.x, short_bg.y(), short_bg.w, short_bg.h(), arc.bg, arc.bg, bgColor);
    } catch (e) {
      console.log("Error in FillRoundRect for short_bg:", e);
    }
  }

  if (ppt.btn_border) {
    try {
      gr.DrawRoundRect(pb_bg.x, pb_bg.y(), pb_bg.w, pb_bg.h(), arc.bg, arc.bg, 1, borderColor);
    } catch (e) {
      console.log("Error in FillRoundRect for btn_border:", e);
    }

    try {
      gr.DrawRoundRect(short_bg.x, short_bg.y(), short_bg.w, short_bg.h(), arc.bg, arc.bg, 1, borderColor);
    } catch (e) {
      console.log("Error in FillRoundRect for short_bg:", e);
    }
  }
};

// user switchable button surrounds/backgrounds
function btn_bg(x, w) {
  this.x = x;
  this.y = function () {
    return (seekbar.y + seekbar.h + _scale(4)) + _scale(1.5);
  };
  this.w = w;
  this.h = function () {
    return Math.floor(bs - _scale(4));
  };
};

// -----------------------------------------------------------------------------
// Modularized functions for updated on_paint(gr) Structure
// -----------------------------------------------------------------------------
// Divided the rendering steps into clearly named helper functions:
//   drawWallpaper(gr);
//   drawPanelBorder(gr);
//   drawAlbumArt(gr);
//   drawSummaryText(gr, textColor);
//   drawSeekbar(gr);
//   drawTime(gr, textColor);
// -----------------------------------------------------------------------------
function drawWallpaper(gr) {
  if (ppt.showwallpaper && g_wallpaperImg) {
    gr.GdiDrawBitmap(g_wallpaperImg, 0, 0, panel.w, panel.h, 0, 0, g_wallpaperImg.Width, g_wallpaperImg.Height);
    gr.FillSolidRect(-1, 0, panel.w+1, panel.h+1, colors.Background & _RGBA(255, 255, 255, ppt.wallpaperalpha));
//    gr.FillSolidRect(-1, 0, panel.w+1, panel.h+1, colors.Background & _RGBA(128,128,128, ppt.wallpaperalpha));
  } else {
    gr.FillSolidRect(-1, -1, panel.w+1, panel.h+1, colors.Background);
  }
}

// -----------------------------------------------------------------------------
function drawPanelBorder(gr) {
  if (ppt.panel_border) {
    gr.DrawRect(0, 0, panel.w - 1, panel.h - 1, 1, colors.Border);
  }
}

// -----------------------------------------------------------------------------
function drawAlbumArt(gr) {
  if (ppt.showalbumart) {
    const item = fb.IsPlaying ? fb.GetNowPlaying() : fb.GetFocusItem();
    albumart = get_album_art(item);
  }

  if (albumart) {
    _drawImage(gr, albumart, art.x, art.y, art.w, art.h);
    summ.x = art.x + art.w + art_spc;
  } else {
    summ.x = 10;
  }
}

// -----------------------------------------------------------------------------
// | drawSummaryText(gr, textColor)
// |   Playback summary consisting of the current track title, artist, and album text.
// -----------------------------------------------------------------------------
// | Improvements 05/15/2026: 
// |   Performs mouse hover detection for each text line independently by 
// |   comparing the current mouse coordinates against the bounding rectangles of the 
// |   title, artist, and album regions. When the mouse is hovering over a specific line, 
// |   that line is drawn using colors.TextHighlight; otherwise it uses colors.TextNormal.
// -----------------------------------------------------------------------------
function drawSummaryText(gr) {
  if (!ppt.nowplaying) return;

  // Hover tests
  overTitle =  mouse.x >= summ.x &&  mouse.x <= summ.x + summ.w &&  mouse.y >= summ.y &&  mouse.y <= summ.y + title.h(); 
  overArtist =  mouse.x >= summ.x &&  mouse.x <= summ.x + summ.w &&  mouse.y >= summ.y + title.h() &&  mouse.y <= summ.y + title.h() + artist.h(); 
  overAlbum =  mouse.x >= summ.x &&  mouse.x <= summ.x + summ.w &&  mouse.y >= summ.y + title.h() + artist.h() &&  mouse.y <= summ.y + title.h() + artist.h() + album.h();

  // Dim unless hovered
  const titleColor  = overTitle  ? colors.TextHighlight : colors.TextNormal;
  const artistColor = overArtist ? colors.TextHighlight : colors.TextNormal;
  const albumColor  = overAlbum  ? colors.TextHighlight : colors.TextNormal;

  summ.y = art.y + ((art.h - (title.h() + artist.h() + album.h())) / 2);
  summ.w = (seekbar.x - handle.w - time.w) - summ.x;

  title.draw(gr, titleColor, summ.x, summ.y, summ.w, title.h(), DT_LEFT | DT_VCENTER | DT_NOPREFIX | DT_END_ELLIPSIS);
  artist.draw(gr, artistColor, summ.x, summ.y + title.h(), summ.w, artist.h(), DT_LEFT | DT_VCENTER | DT_NOPREFIX | DT_END_ELLIPSIS);
  album.draw(gr, albumColor, summ.x, summ.y + title.h() + artist.h(), summ.w, album.h(), DT_LEFT | DT_VCENTER | DT_NOPREFIX | DT_END_ELLIPSIS);

};

// -----------------------------------------------------------------------------
// | 07/06/2025: Seekbar: Paused and Playing Colors are no longer used.  Value shared with buttonBackground.
// -----------------------------------------------------------------------------
function drawSeekbar(gr) {
  const baseColor = colors.ButtonBackground;
  const progressColor = (!fb.IsPlaying || fb.IsPaused) ? colors.SeekProgress & _RGBA(255,255,255,160) : colors.SeekProgress;
  const borderColor = colors.Border;
  const pos = seekbar.pos();

  gr.FillRoundRect(seekbar.x, seekbar.y, seekbar.w, seekbar.h, arc.bar, arc.bar, baseColor);
  gr.FillRoundRect(volbar.x, volbar.y, volbar.w + _scale(6), volbar.h, arc.bar, arc.bar, baseColor);
  gr.FillRoundRect(volbar.x, volbar.y, volbar.pos() + 10, volbar.h, arc.bar, arc.bar, progressColor);

  if (fb.IsPlaying && fb.PlaybackLength > 0) {
    gr.FillRoundRect(seekbar.x, seekbar.y, pos + seekbar.h, seekbar.h, arc.bar, arc.bar, progressColor);
    if (ppt.seekbar_border) {
      gr.DrawRoundRect(seekbar.x, seekbar.y, seekbar.w, seekbar.h, arc.bar, arc.bar, 1, borderColor);
      gr.DrawRoundRect(volbar.x, volbar.y, volbar.w + _scale(6), volbar.h, arc.bar, arc.bar, 1, borderColor);
     }
    gr.FillEllipse(seekbar.x + pos - _scale(3), handle.y, handle.w, handle.h, fb.IsPaused ? colors.TextHighlight & colors.TextNormal : colors.TextHighlight);
    gr.FillEllipse(volbar.x + volbar.pos(), handle.y, handle.w, handle.h, fb.IsPaused ? colors.TextHighlight & colors.TextNormal : colors.TextHighlight);
  }
}

// -----------------------------------------------------------------------------
let cachedTimeText = null;
let cachedTimeWidth = 0;

function drawTime(gr, textColor) {
  const timeText = pb_time.tf.Eval(true);
  const timeFont = pb_time.font();

  if (timeText !== cachedTimeText) {
    cachedTimeText = timeText;
    cachedTimeWidth = gr.CalcTextWidth(timeText, timeFont);
  }

  time.w = cachedTimeWidth + handle.w;
  time.h = timeFont.Height;
  time.x = seekbar.x - time.w - handle.w;
  time.y = seekbar.y - ((time.h - seekbar.h) / 2);

  gr.GdiDrawText(timeText, timeFont, textColor, time.x, time.y, time.w, time.h, DT_RIGHT | DT_VCENTER | DT_CALCRECT | DT_NOPREFIX | DT_END_ELLIPSIS);
  gr.GdiDrawText(pb_len.tf.Eval(true), pb_len.font(), textColor, seekbar.x + seekbar.w + handle.w + _scale(3), time.y, _scale(35), time.h, DT_LEFT | DT_VCENTER | DT_CALCRECT | DT_NOPREFIX | DT_END_ELLIPSIS);
}

// -----------------------------------------------------------------------------
// get_album_art improvements â€” 6/17/2025.
// -----------------------------------------------------------------------------
// Improvements:
//   Checks metadb before attempting to access it.
//   Catches errors: GetAlbumArtV2 can occasionally throw if the file is invalid or inaccessible.
//   Always returns null if no valid image is found, making it easier to check later.
// -----------------------------------------------------------------------------
function get_album_art(metadb) {
  if (!metadb)
    return null;

  try {
    return utils.GetAlbumArtV2(metadb, 0, false); // 0 = front cover
  } catch (e) {
    return null;
  }
};

// -----------------------------------------------------------------------------
// setWallpaperImg improvements â€” @Br3tt, 6/17/2025.
// -----------------------------------------------------------------------------
// Improvements:
//   Explicit return null instead of falling through with undefined.
//   Check for focus item to avoid passing null to GetAlbumArtV2.
//   Comment-friendly: switch between GetAlbumArtV2 and get_album_art() easily.
//   TitleFormat evaluation clarity: split out for readability.
// -----------------------------------------------------------------------------
function setWallpaperImg(metadb) {
	if (!ppt.showwallpaper) return null;

	let tmp = null;

	if (ppt.wallpapermode === 0) {
		if (!metadb) return null;

		// Prefer focused item if available
		let item = fb.GetFocusItem();
		if (item) {
			tmp = utils.GetAlbumArtV2(item, 0); // 0 = front cover
		}
	} else {
		// Path from TitleFormat string (e.g., "$directory_path(%path%)\\wallpaper.jpg")
		const path = fb.TitleFormat(ppt.wallpaperpath).Eval();
		const arr = utils.Glob(path);
		if (arr.length > 0) {
			tmp = gdi.Image(arr[0]);
		}
	}

	if (tmp) {
		return FormatWallpaper(tmp);
	}

	return null;
}

// -----------------------------------------------------------------------------
// FormatWallpaper (SpiderMonkey Compatible) 
// -----------------------------------------------------------------------------
// Improvements â€” 6/18/2025.
//   Added safety check for panel to avoid potential runtime errors.
//   Used true instead of 1 for auto_fill in drawImage() to clarify intent.
//   Moved default fallback logic for blur value into a variable.
//   Returned original img if anything fails or CreateRawBitmap() isn't available.
// -----------------------------------------------------------------------------
function FormatWallpaper(img) {
	if (!img || !panel || !panel.w || !panel.h) return img;

	let tmp_img = gdi.CreateImage(panel.w, panel.h);
	const gp = tmp_img.GetGraphics();
	drawImage(gp, img, 0, 0, panel.w, panel.h, true);
	tmp_img.ReleaseGraphics(gp);

	// Optional blur
	if (ppt.wallpaperblurred) {
		const blur_val = (ppt.wallpaperblurvalue >= 2 && ppt.wallpaperblurvalue <= 90) ? ppt.wallpaperblurvalue : 90;
		tmp_img = draw_blurred_image(
			tmp_img,
			0, 0, tmp_img.Width, tmp_img.Height, // source rect
			0, 0, tmp_img.Width, tmp_img.Height, // blur box area
			blur_val,
			0x00ffffff // fully transparent overlay
		);
	}

	return tmp_img ? tmp_img.CreateRawBitmap() : img;
}

// -----------------------------------------------------------------------------
// draw_blurred_image (SpiderMonkey Compatible) 
// -----------------------------------------------------------------------------
// Improvements 6/18/2025:
//   Removed redundancy (e.g., double declaration of gb)
//   Avoided unnecessary re-calculation
//   Improved readability (clear separation of steps, logical structure)
//   Defensive programming (try/catch, null checks, coordinate checks)
// -----------------------------------------------------------------------------
function draw_blurred_image(image, ix, iy, iw, ih, bx, by, bw, bh, blur_value, overlay_color) {
    if (!image) return null;

    const blurValue = blur_value;
    const scaledW = Math.max(1, Math.floor(iw * blurValue / 100));
    const scaledH = Math.max(1, Math.floor(ih * blurValue / 100));
    let imgA, imgB;

    try {
        imgA = image.Resize(scaledW, scaledH, 2);
        imgB = imgA.Resize(iw, ih, 2);
    } catch (e) {
        return null;
    }

    // Step 1: Create blurred region
    const bbox = gdi.CreateImage(bw, bh);
    let gb = bbox.GetGraphics();
    const offset = 90 - blurValue;
    gb.DrawImage(
        imgB,
        -offset,
        -((ih - bh) + offset),
        iw + offset * 2,
        ih + offset * 2,
        0, 0, imgB.Width, imgB.Height,
        0, 255
    );
    bbox.ReleaseGraphics(gb);

    // Step 2: Compose final image
    const newImg = gdi.CreateImage(iw, ih);
    gb = newImg.GetGraphics();

    const hasOffset = (ix !== bx || iy !== by || iw !== bw || ih !== bh);

    if (hasOffset) {
        gb.DrawImage(image, ix, iy, iw, ih, 0, 0, image.Width, image.Height, 0, 255);
        gb.FillSolidRect(bx, by, bw, bh, 0xFFFFFFFF);
    }

    gb.DrawImage(bbox, bx, by, bw, bh, 0, 0, bbox.Width, bbox.Height, 0, 255);

    // Step 3: Optional overlay
    if (overlay_color != null) {
        gb.FillSolidRect(bx, by, bw, bh, overlay_color);
    }

    // Step 4: Top border highlight/shadow
    if (hasOffset) {
        gb.FillSolidRect(bx, by, bw, 1, 0x22FFFFFF);   // light top border
        gb.FillSolidRect(bx, by - 1, bw, 1, 0x22000000); // subtle shadow
    }

    newImg.ReleaseGraphics(gb);
    return newImg;
}

// -----------------------------------------------------------------------------
// drawImage (SpiderMonkey Compatible) 
// -----------------------------------------------------------------------------
// Improvements â€” 06/17/2025.
//   Avoided magic numbers: alpha ?? 255 ensures clarity.
//   Reduced repetition: DrawImage arguments grouped clearly, no duplicate calculations.
//   Simplified logic: Easier to read with fewer nested structures.
// -----------------------------------------------------------------------------
function drawImage(gr, img, src_x, src_y, src_w, src_h, auto_fill, border, alpha) { 
    if (!img || !src_w || !src_h) return;

    const a = (typeof alpha === 'number') ? alpha : 255;
    gr.SetInterpolationMode(7);

    let dst_x = 0, dst_y = 0, dst_w = img.Width, dst_h = img.Height;

    if (auto_fill) {
        const imgRatio = img.Width / img.Height;
        const srcRatio = src_w / src_h;

        if (imgRatio < srcRatio) {
            dst_h = Math.round(src_h * img.Width / src_w);
            dst_y = Math.round((img.Height - dst_h) / 4);
        } else {
            dst_w = Math.round(src_w * img.Height / src_h);
            dst_x = Math.round((img.Width - dst_w) / 2);
        }

        gr.DrawImage(
            img,
            src_x, src_y, src_w, src_h,
            dst_x + 3, dst_y + 3, dst_w - 6, dst_h - 6,
            0, a
        );
    } else {
        const scale = Math.min(src_w / img.Width, src_h / img.Height);
        dst_w = Math.floor(img.Width * scale);
        dst_h = Math.floor(img.Height * scale);

        const offsetX = Math.round((src_w - dst_w) / 2);
        const offsetY = src_h - dst_h;

        gr.DrawImage(
            img,
            src_x + offsetX, src_y + offsetY, dst_w, dst_h,
            0, 0, img.Width, img.Height,
            0, a
        );

        // Update source rect for border
        src_x += offsetX;
        src_y += offsetY;
        src_w = dst_w;
        src_h = dst_h;
    }

    if (border) {
        gr.DrawRect(src_x, src_y, src_w - 1, src_h - 1, 1, border);
    }
};

// -----------------------------------------------------------------------------
// marc2003 last.fm functionality.
// -----------------------------------------------------------------------------
function lfm_button() {
  switch (true) {
  case lastfm.username.length == 0 /*|| lastfm.sk.length != 32*/:
    lfm.n = _chrToImg(chrs.info, colors.TextNormal, fluent);
    lfm.h = _chrToImg(chrs.info, colors.TextNormal, fluent);
    lfm.func = null;
    lfm.tip = 'Right click to set your Last.fm username and authorise.';
    break;
  case !panel.metadb:
    lfm.n = _chrToImg(chrs.info, colors.TextNormal, fluent);
    lfm.h = _chrToImg(chrs.info, colors.TextNormal, fluent);
    lfm.func = null;
    lfm.tip = 'No selection';
    break;
  case parseInt(panel.tf('%SMP_LOVED%'), 10) == 1:
    lfm.n = _chrToImg(chrs.loved, colors.Heart, fluent);
    lfm.h = _chrToImg(chrs.unloved, colors.TextNormal, fluent);
    lfm.func = function () {
      lastfm.post('track.unlove', null, panel.metadb);
    }
    lfm.tip = panel.tf('Unlove "%title%" by "%artist%"');
    break;
  default:
    lfm.n = _chrToImg(chrs.unloved, colors.TextNormal, fluent);
    lfm.h = _chrToImg(chrs.loved, colors.Heart, fluent);
    lfm.func = function () {
      lastfm.post('track.love', null, panel.metadb);
    }
    lfm.tip = panel.tf('Love "%title%" by "%artist%"');
  };
};

function on_notify_data(name, data) {
  lastfm.notify_data(name, data);
};

// --------------------------------------------------------------------------------------------------------------------------------------
// 05/25/2026: Variable decalarations moved to end of file.
// --------------------------------------------------------------------------------------------------------------------------------------
const ppt = {
  showalbumart: window.GetProperty(     'ARTWORK: Show', true),
  artsize: window.GetProperty(          'ARTWORK: Size (px)', 60),
	artrun: window.GetProperty(           'ARTWORK: Context Command', 'Run service/Google Album Artist + Album'), // Named Service in foo_run component.
  heart: window.GetProperty(            'BUTTONS: Heart Color (r,g,b,a)', '95,0,16,255'),
  btn_bg: window.GetProperty(           'BUTTONS: Background', false),
  btn_border: window.GetProperty(       'BUTTONS: Border', false),
  btn_bg_alpha: window.GetProperty(     'BUTTONS: Background Alpha', '96'),
  bs: window.GetProperty(               'BUTTONS: Size (20-40px)', 32),
  background: window.GetProperty(       'COLORS: Panel Background (r,g,b,a)', '32,32,32,255'),
  panel_border: window.GetProperty(     'PANEL: Border', false),
  seekbar_border: window.GetProperty(   'SEEKBAR: Border', false),
  seekbar_handle: window.GetProperty(   'SEEKBAR: Handle Size (px)', 12),
  seekprog: window.GetProperty(         'COLORS: Seekbar Progress (r,g,b,a)', '200,97,44,255'),
  seekbar_height: window.GetProperty(   'SEEKBAR: Thickness (px)', 6),
  nowplaying: window.GetProperty(       'TEXT: Now Playing', true),
  font: fontName,
  texthighlight: window.GetProperty(    'COLORS: Text Highlight (r,g,b,a)', '255,255,255,255'),
  textnormal: window.GetProperty(       'COLORS: Text Normal (r,g,b,a)', '160,160,160,255'),
  title_fsize: window.GetProperty(      'TEXT: Now Playing Line1 Size', 10),
  title: window.GetProperty(            'TEXT: Now Playing Line1 Format', '[%title%]'),
  titlerun: window.GetProperty(         'TEXT: Title Context Command', 'Run service/Google Artist + Title'), 						// Named Service in foo_run component.
  artist_fsize: window.GetProperty(     'TEXT: Now Playing Line2 Size', 9),
  artist: window.GetProperty(           'TEXT: Now Playing Line2 Format', '[%artist%]  \u2022  [%album%][  \u2022  %date%]'),//[%artist%]  \u2022  [%album%][  \u2022  $month(%last_played_enhanced%)-$day_of_month(%last_played_enhanced%)-$year(%last_played_enhanced%)]
  artistrun: window.GetProperty(        'TEXT: Artist Context Command', 'Run service/Google Artist'), 						// Named Service in foo_run component.
  album_fsize: window.GetProperty(      'TEXT: Now Playing Line3 Size', 8),
  album: window.GetProperty(            'TEXT: Now Playing Line3 Format', '[%codec%[ %codec_profile%]][  •  %bitrate% kbs][  •  %filesize_natural%][  •  %play_count% $ifgreater(%play_count%,1,plays,play)][$if(%last_played_enhanced%,  •  Last: $month(%last_played_enhanced%)\'-\'$day_of_month(%last_played_enhanced%)\'-\'$right($year(%last_played_enhanced%),2),)]'),
  pb_len: window.GetProperty(           'TEXT: Playback Length Format', '[%playback_time_remaining%]'),
  pb_time: window.GetProperty(          'TEXT: Playback Time Format', '[%playback_time%] '),
  showwallpaper: window.GetProperty(    'WALLPAPER: Show', false),
  wallpaperalpha: window.GetProperty(   'WALLPAPER: Alpha', 224),
  wallpaperblurvalue:window.GetProperty('WALLPAPER: Blur Value (2-90)', 3),//1.05,
  wallpaperblurred: window.GetProperty( 'WALLPAPER: Blur', false),
  wallpaperpath: window.GetProperty(    'WALLPAPER: Default Path', '.\\user-components\\foo_spider_monkey_panel\\samples\\js-smooth\\images\\default.png'),
  wallpapermode: window.GetProperty(    'WALLPAPER: Mode (0: Internal 1: External)', 0),
  play_btn_count:                       7, // number of playback and shortcut control buttons under seekbar and volume bar.
  short_btn_count:                      5,
  save_chr: window.GetProperty(         'BUTTONS: Shortcut 4 Character', '\ue1cb'),
  save_run: window.GetProperty(         'BUTTONS: Shortcut 4 Context Command', 'Run service/MP3 tag'),
  save_tt: window.GetProperty(          'BUTTONS: Shortcut 4 ToolTip', 'Run MP3 Tag'),
};

// -----------------------------------------------------------------------------
// 07/06/2025: Changed colors.ButtonBackground to be a dark overlay using alpha _RGBA(0, 0, 0, 96).
// 08/15/2026: Added ppt.btn_bg_alpha for user selectable colors.ButtonBackground.
// -----------------------------------------------------------------------------
const colors = {
  TextNormal:       make_rgb(ppt.textnormal),
  TextHighlight:    make_rgb(ppt.texthighlight),
  Heart:            make_rgb(ppt.heart),
  SeekProgress:     make_rgb(ppt.seekprog),
  Background:       make_rgb(ppt.background),
  ButtonBackground: make_rgb('0, 0, 0,' + ppt.btn_bg_alpha),
  Border:           make_rgb('255, 255, 255,' + ppt.btn_bg_alpha),
};

const album = new tfo(fb.TitleFormat(ppt.album), ppt.album_fsize, 0, ppt.album);
let albumart = null;
const arc =					{bar: 0, bg: 0};// diameter for FillRoundRect func for progress and volume bars
const art =					{x: 0, y: 0, w: 0, h: 0};
const art_spc =			8; //spacer around album art
const artist =			new tfo(fb.TitleFormat(ppt.artist), ppt.artist_fsize, 1, ppt.artist);
const bs =					Math.floor(ppt.bs >= 20 && ppt.bs <= 40 ? _scale(ppt.bs) : _scale(28));
const fluentAvailable = utils.CheckFont('Segoe Fluent Icons');

if (!fluentAvailable) {
    console.log(
        N,
        'Segoe Fluent Icons font not found. Install the Segoe Fluent Icons font for the intended PlayControl button appearance.'
    );
}

const fluent = _gdiFont(
    fluentAvailable ? 'Segoe Fluent Icons' : 'Segoe UI Symbol',
    38,
    1
);
const handle =			{w: 0, h: 0, y: 0};
const pb_bg =				new btn_bg(0, 0);
const short_bg =		new btn_bg(0, 0);
const pb_len =			new tfo(fb.TitleFormat(ppt.pb_len), 9, 0);
const pb_time =			new tfo(fb.TitleFormat(ppt.pb_time), 9, 0);
const summ =				{x: 0, y: 0, w: 0};
const time =				{x: 0, y: 0, w: 0, h: 0};
const title =				new tfo(fb.TitleFormat(ppt.title), ppt.title_fsize, 1, ppt.title);
const mouse =				{x: -1, y: -1};
let overTitle	=		0;
let overArtist =	0;
let overAlbum	=		0;
const lfm =					{n: 0, h: 0, func: 0, tip: 0};

const chrs = {
  prf:        '\ue713',
  prev:       '\ue892',
  rwind:      '\ued3c', //'\ueb9e',
  play:       '\ue768', //'\uF5B0'
  pause:      '\ue769', //'\ue769',
  ffwd:       '\ued3d', //'\ueb9d',
  next:       '\ue893',
  save:       '\ue1cb', //'\uf02c', '\ue78c', '\ue8ec',
  search:     '\ue721',
  dsp:        '\uf8a6', //'\uF4C3',
  mute:       '\ue74f',
  vol0:       '\ue992',
  vol1:       '\ue993',
  vol2:       '\ue994',
  vol3:       '\ue995',
  repeat_all: '\ue8ee',
  repeat_one: '\ue8ed',
  default:    '\ue292', //'\uf5e7',
  shuffle:    '\ue8b1',
  random:     '\ue7bc',
  album:      '\ue93c',
  folder:     '\ued25',
  skipoff:    '\uf0b5', //'\uf204',
  skip:       '\uea98', //'\uf205',
  info:       '\uE9CE',
  loved:      '\uE0A5',
  unloved:    '\uE006',
};

// -----------------------------------------------------------------------------
// Button handlers: functions that control what action each button does
// -----------------------------------------------------------------------------
const btnHandlers = {
  love: function ()       { lfm.func(); },
  prev: function ()       { fb.Prev(); },
  rwind: function ()      { fb.RunMainMenuCommand('Playback/Seek/Back by 10 seconds'); },
  playPause: function ()  { fb.PlayOrPause(); },
  ffwd: function ()       { fb.RunMainMenuCommand('Playback/Seek/Ahead by 30 seconds'); },
  next: function ()       { fb.Next(); },
  pbo: function ()        { const pbo = plman.PlaybackOrder; plman.PlaybackOrder = (pbo >= pbo_btn.chr.length - 1 ? 0 : pbo + 1); },
  pref: function ()       { fb.ShowPreferences(); },
  dsp: function ()        { fb.RunMainMenuCommand('Playback/DSP Settings/Preferences'); },
  search: function ()     { fb.RunMainMenuCommand('Library/Facets'); },
  save: function ()       { fb.RunContextCommand(ppt.save_run); },
  skip: function ()       { if (_cc("foo_skip")) { fb.RunMainMenuCommand('Playback/Skip tracks & use bookmarks'); } },
  vol: function ()        { fb.VolumeMute(); }
};


// -----------------------------------------------------------------------------
// Playback Order button characters and tooltips.
// -----------------------------------------------------------------------------
const pbo_btn = {
  chr: [chrs.default, chrs.repeat_all, chrs.repeat_one, chrs.random, chrs.shuffle, chrs.album, chrs.folder],
  tip: ['Default', 'Repeat (Playlist)', 'Repeat (Track)', 'Random', 'Shuffle (tracks)', 'Shuffle (albums)', 'Shuffle (folders)']
};

// Shared validated font for text rendering and tooltip initialization.






// ============================================================================
// PlayControl volume control
// PlayControl volume functions.
// ============================================================================


function _volume(x, y, w, h) {
	this.volume_change = () => {
		window.RepaintRect(this.x, this.y, this.w, this.h);
	}
	
	this.trace = (x, y) => {
		const m = this.drag ? 200 : 0;
		return x > this.x - m && x < this.x + this.w + (m * 2) && y > this.y - m && y < this.y + this.h + (m * 2);
	}
	
	this.wheel = (s) => {
		if (this.trace(this.mx, this.my)) {
			if (s == 1) {
				fb.VolumeUp();
			} else {
				fb.VolumeDown();
			}
			_tt('');
			return true;
		} else {
			return false;
		}
	}
	
	this.move = (x, y) => {
		this.mx = x;
		this.my = y;
		if (this.trace(x, y)) {
			x -= this.x;
			const pos = x < 0 ? 0 : x > this.w ? 1 : x / this.w;
			this.drag_vol = Math.max(-100, 10 * Math.log(pos) / Math.LN2);
			_tt(this.drag_vol.toFixed(2) + ' dB');
			if (this.drag) {
				fb.Volume = this.drag_vol;
			}
			this.hover = true;
			return true;
		} else {
			if (this.hover) {
				_tt('');
			}
			this.hover = false;
			this.drag = false;
			return false;
		}
	}
	
	this.lbtn_down = (x, y) => {
		if (this.trace(x, y)) {
			this.drag = true;
			return true;
		} else {
			return false;
		}
	}
	
	this.lbtn_up = (x, y) => {
		if (this.trace(x, y)) {
			if (this.drag) {
				this.drag = false;
				fb.Volume = this.drag_vol;
			}
			return true;
		} else {
			return false;
		}
	}
	
	this.pos = (type) => {
		return Math.ceil((type == 'h' ? this.h : this.w) * Math.pow(2, fb.Volume / 10));
	}
	
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.mx = 0;
	this.my = 0;
	this.hover = false;
	this.drag = false;
	this.drag_vol = 0;
}


// ============================================================================
// PlayControl seekbar
// PlayControl seekbar functions.
// ============================================================================


function _seekbar(x, y, w, h) {
	this.playback_seek = () => {
		window.RepaintRect(this.x - _scale(75), this.y - _scale(10), this.w + _scale(150), this.h + _scale(20));
	}
	
	this.playback_stop = () => {
		this.playback_seek();
	}
	
	this.trace = (x, y) => {
		const m = this.drag ? 200 : 0;
		return x > this.x - m && x < this.x + this.w + (m * 2) && y > this.y - m && y < this.y + this.h + (m * 2);
	}
	
	this.wheel = (s) => {
		if (this.trace(this.mx, this.my)) {
			switch (true) {
			case !fb.IsPlaying:
			case fb.PlaybackLength <= 0:
				break;
			case fb.PlaybackLength < 60:
				fb.PlaybackTime += s * 5;
				break;
			case fb.PlaybackLength < 600:
				fb.PlaybackTime += s * 10;
				break;
			default:
				fb.PlaybackTime += s * 60;
				break;
			}
			_tt('');
			return true;
		} else {
			return false;
		}
	}
	
	this.move = (x, y) => {
		this.mx = x;
		this.my = y;
		if (this.trace(x, y)) {
			if (fb.IsPlaying && fb.PlaybackLength > 0) {
				x -= this.x;
				this.drag_seek = x < 0 ? 0 : x > this.w ? 1 : x / this.w;
				_tt(utils.FormatDuration(fb.PlaybackLength * this.drag_seek));
				if (this.drag) {
					this.playback_seek();
				}
			}
			this.hover = true;
			return true;
		} else {
			if (this.hover) {
				_tt('');
			}
			this.hover = false;
			this.drag = false;
			return false;
		}
	}
	
	this.lbtn_down = (x, y) => {
		if (this.trace(x, y)) {
			if (fb.IsPlaying && fb.PlaybackLength > 0) {
				this.drag = true;
			}
			return true;
		} else {
			return false;
		}
	}
	
	this.lbtn_up = (x, y) => {
		if (this.trace(x, y)) {
			if (this.drag) {
				this.drag = false;
				fb.PlaybackTime = fb.PlaybackLength * this.drag_seek;
			}
			return true;
		} else {
			return false;
		}
	}
	
	this.pos = () => {
		return Math.ceil(this.w * (this.drag ? this.drag_seek : fb.PlaybackTime / fb.PlaybackLength));
	}
	
	this.interval_func = () => {
		if (fb.IsPlaying && !fb.IsPaused && fb.PlaybackLength > 0) {
			this.playback_seek();
		}
	};
	
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.mx = 0;
	this.my = 0;
	this.hover = false;
	this.drag = false;
	this.drag_seek = 0;
	window.SetInterval(this.interval_func, 150);
}


// ============================================================================
// PlayControl panel
// PlayControl panel functions.
// ============================================================================


function _panel() {
	this.item_focus_change = () => {
		if (this.metadb_func) {
			this.metadb = fb.IsPlaying ? fb.GetNowPlaying() : fb.GetFocusItem();
			on_metadb_changed();
			if (!this.metadb) {
				_tt('');
			}
		}
	};

	this.colors_changed = () => {
		// PlayControl uses its own configured colors; retained as a callback
		// target for the SMP color-change event.
	};

	this.font_changed = () => {
		// PlayControl uses its own configured fonts; retained as a callback
		// target for the SMP font-change event.
	};

	this.size = () => {
		this.w = window.Width;
		this.h = window.Height;
	};

	this.tf = (t) => {
		if (!this.metadb) {
			return '';
		}
		if (!this.tfo[t]) {
			this.tfo[t] = fb.TitleFormat(t);
		}
		const path = this.tfo['$if2(%__@%,%path%)'].EvalWithMetadb(this.metadb);
		if (fb.IsPlaying && (path.startsWith('http') || path.startsWith('mms'))) {
			return this.tfo[t].Eval();
		}
		return this.tfo[t].EvalWithMetadb(this.metadb);
	};

	this.w = 0;
	this.h = 0;
	this.metadb = fb.GetFocusItem();
	this.metadb_func = typeof on_metadb_changed == 'function';
	this.tfo = {
		'$if2(%__@%,%path%)': fb.TitleFormat('$if2(%__@%,%path%)')
	};
	this.size();
}

// -----------------------------------------------------------------------------
// _createFolder: Last.fm data-folder support.
// -----------------------------------------------------------------------------
const fso = new ActiveXObject('Scripting.FileSystemObject');

function _createFolder(path) {
	if (!path || fso.FolderExists(path)) return;

	let parent = fso.GetParentFolderName(path);
	if (parent && !fso.FolderExists(parent)) {
		_createFolder(parent);
	}

	try {
		fso.CreateFolder(path);
	} catch (e) {}
}

// -----------------------------------------------------------------------------
// Play/Pause animation
// -----------------------------------------------------------------------------
// Runtime-only animation. The timer changes phase and repaints the panel;
// normal button hover state takes priority over the animation phase.
// -----------------------------------------------------------------------------
function startPlayBlink() {
	const playBlinkInterval = 500;
  if (playBlinkTimer) return;

  playBlinkPhase = false;
  playBlinkTimer = window.SetInterval(function () {
    if (!fb.IsPlaying || fb.IsPaused) {
      stopPlayBlink();
      return;
    }

    playBlinkPhase = !playBlinkPhase;
    window.Repaint();
  }, playBlinkInterval);
}

function stopPlayBlink() {
  if (playBlinkTimer) {
    window.ClearInterval(playBlinkTimer);
    playBlinkTimer = null;
  }

  playBlinkPhase = false;
  window.Repaint();
}

// ============================================================================
// PlayControl callbacks
// ============================================================================


function on_script_unload() {
  stopPlayBlink();
  try {
    buttons.update();
    g_wallpaperImg = setWallpaperImg() || g_wallpaperImg;
    window.Repaint(true);
  } catch (e) {
    console.log('Error in on_script_unload:', e);
  }
};

function on_colors_changed() {
  panel.colors_changed();
  window.Repaint(true);
};

function on_font_changed() {
  panel.font_changed();
  window.Repaint();
};

function on_item_focus_change() {
  panel.item_focus_change();
};

function on_metadb_changed() {
  buttons.update();
  window.Repaint();
};

function on_output_device_changed() {
  buttons.update();
};

function on_playlist_switch() {
  panel.item_focus_change();
};

function on_volume_change() {
  buttons.update();
  volbar.volume_change();
//	_tt(fb.Volume.toFixed(0) + ' dB');
  window.Repaint();
};

// -----------------------------------------------------------------------------
// | PlayControl left-button mouse handling.
// |  Modified 05/16/2026.
// |  Handles left mouse button release events and performs context actions when clicking album art/title/artist regions.
// -----------------------------------------------------------------------------
// ### Summary
// * Determines whether the mouse release occurred over the album art area.
// * Passes the event to:
//   * `buttons.lbtn_up()`
//   * `seekbar.lbtn_up()`
//   * `volbar.lbtn_up()`
// * If any of those handlers process the click, the function exits immediately.
// * If the click occurred over the album art and album art display is enabled (`ppt.showalbumart`), it runs the configured album art context command (`ppt.artrun`).
// * If the click occurred over the title area while â€œnow playingâ€ mode is enabled, it runs the title context command (`ppt.titlerun`).
// * If the click occurred over the artist area while â€œnow playingâ€ mode is enabled, it runs the artist context command (`ppt.artistrun`).
// * Finally, it issues the Foobar2000 main menu command:
//   * `View/Highlight Now Playing`
// -----------------------------------------------------------------------------
function on_mouse_lbtn_down(x, y) {
  seekbar.lbtn_down(x, y);
  volbar.lbtn_down(x, y);
};

function on_mouse_lbtn_up(x, y, mask) {
  const overArt = x >= art.x && x <= art.x + art.w && y >= art.y && y <= art.y + art.h;
  if (buttons.lbtn_up(x, y, mask) || seekbar.lbtn_up(x, y) || volbar.lbtn_up(x, y)) {
    return;
  }
  if (overArt && ppt.showalbumart) {
    fb.RunContextCommand(ppt.artrun);
  }
  if (overTitle && ppt.nowplaying) {
			fb.RunContextCommand(ppt.titlerun);
	}
  if (overArtist && ppt.nowplaying) {
			fb.RunContextCommand(ppt.artistrun);
	}
  if (overAlbum && ppt.nowplaying) {
			fb.RunContextCommand(ppt.artrun);
	}
  fb.RunMainMenuCommand('View/SHow Now Playing in playlist');
}

function on_mouse_rbtn_up(x, y) {
  if (buttons.buttons.love.trace(x, y)) {
    const flag = lastfm.username.length ? MF_STRING : MF_GRAYED;
    let m = window.CreatePopupMenu();
    m.AppendMenuItem(MF_STRING, 1, 'Last.fm username...');
    m.AppendMenuItem(flag, 2, 'Authorise');
    m.AppendMenuItem(flag, 3, 'Bulk import Last.fm loved tracks');
    m.AppendMenuItem(MF_STRING, 4, 'Show loved tracks');
    m.AppendMenuItem(MF_STRING, 5, 'Configure...');

    const idx = m.TrackPopupMenu(x, y); 
    switch (idx) {
    case 1:
      lastfm.update_username();
      break;
    case 2:
      lastfm.post('auth.getToken');
      break;
    case 3:
      lastfm.get_loved_tracks(1);
      break;
    case 4:
      fb.ShowLibrarySearchUI('%SMP_LOVED% IS 1');
      break;
    case 5:
      window.ShowConfigure();
      break;
    }

    return true;
	} else {
		_help(x, y);
		return true;
  }
};

function on_mouse_leave() {
  buttons.leave();
};

function on_mouse_move(x, y) {
	mouse.x = x;
	mouse.y = y;

  if (buttons.move(x, y)) return;
  volbar.move(x, y);
  seekbar.move(x, y);

	window.Repaint();
};

function on_mouse_wheel(s) {
  if (seekbar.wheel(s))
    return;
  if (s > 0) {
    fb.VolumeUp();
  } else if (s < 0) {
    fb.VolumeDown();
  }
};

// -----------------------------------------------------------------------------
// | PlayControl playback callbacks.
// -----------------------------------------------------------------------------
function on_playback_edited() {
  window.Repaint();
};

function on_playback_new_track(metadb) {
  if (!metadb) return;
  g_wallpaperImg = setWallpaperImg(metadb) || g_wallpaperImg;
  albumart = get_album_art(metadb);
  if (fb.IsPlaying && !fb.IsPaused) startPlayBlink();
  else stopPlayBlink();
  window.Repaint();
};

function on_playback_order_changed() {
  buttons.update();
  window.Repaint();
};

function on_playback_pause(state) {
  buttons.update();
  if (state) stopPlayBlink();
  else if (fb.IsPlaying) startPlayBlink();
  else stopPlayBlink();
};

function on_playback_seek() {
  seekbar.playback_seek();
};

function on_playback_starting(cmd, is_paused) {
  buttons.update();
  if (!is_paused) startPlayBlink();
  else stopPlayBlink();
};

function on_playback_stop(reason) {
  stopPlayBlink();
  buttons.update();

  switch (reason) {
    case 0: // user stop
    case 1: // eof
      g_wallpaperImg = setWallpaperImg() || g_wallpaperImg;
      window.Repaint();
      break;
    case 2: // starting_another
      break;
  }
};

// ============================================================================
// PlayControl main
// ============================================================================


// ----------------------------------------------------------------------------------------------
// |'PlayControl by whistlechips; including functionality by @marc2003,                         |
// |  @Br3tt aka Falstaff and ChatGPT.                                                          |
// ----------------------------------------------------------------------------------------------

const panel = new _panel();
const seekbar = new _seekbar(0, 0, 0, 0);
const volbar = new _volume(0, 0, 0, 0);
const buttons = new _buttons();
const lastfm = new _lastfm();
let g_wallpaperImg = null;
let playBlinkTimer = null;
let playBlinkPhase = false;


// --------------------------------------------------------------------------------------------------------------------------------------
// |on_paint function    | update and render UI elements based on playback state and user settings.                                     |
// |------------------------------------------------------------------------------------------------------------------------------------|
// |  Wallpaper Handling | Draws a wallpaper image if enabled, with an optional alpha transparency setting.                             |
// |  Panel Border       | Draws a border around the panel if enabled.                                                                  |
// |  Album Cover        | Retrieves and displays the album art if configured to show it.                                               |
// |  Summary Text       | Draws song title, artist, and album information if configured, adjusting positions based on artwork presence.|
// |  Button Styling     | Renders play, shortcut, and volume buttons with customizable background fill, borders, and styling.          |
// |  Seek/Volume Bars   | Handles seekbar progress, playback position indicator, volume control bar, and playback time display.        |
// |  Time Drawing       | Displays elapsed and remaining playback time.                                                                |
// |  Button Painting    | Utilizes a buttons object to handle the rendering of various interactive buttons.                            |
// |------------------------------------------------------------------------------------------------------------------------------------|
// | 06/21/2025: Modularized.                                                                                                           |
// | 07/06/2025: Folded drawVolumeBar() function into drawSeekbar().                                                                    |
// --------------------------------------------------------------------------------------------------------------------------------------

if (fb.IsPlaying && !fb.IsPaused) startPlayBlink();

function on_paint(gr) {
//	.disable.uih.FrameStyle._hacks()

  gr.SetSmoothingMode(2);
  drawWallpaper(gr);
  drawButtonsBgBorder(gr);
  buttons.paint(gr);
  drawPanelBorder(gr);
  drawAlbumArt(gr);
  drawSummaryText(gr);
  drawSeekbar(gr);
  const textColor = (!fb.IsPlaying || fb.IsPaused) ? colors.TextNormal : colors.TextHighlight;
  drawTime(gr, textColor);
};

// -----------------------------------------------------------------------------------------------
// | buttons.update function, SpiderMonkey-Focused Optimizations, 6/18/2025:                     |
// -----------------------------------------------------------------------------------------------
// | Improvement          | Result                                                               |
// | -------------------- | -------------------------------------------------------------------- |
// | Centralized config   | Easy to reorder, toggle, or add buttons in one place                 |
// | DRY principle        | No repeated `_button(...)` logic                                     |
// | Easier maintenance   | All logic about which buttons exist is now in structured arrays      |
// | SpiderMonkey safe    | Uses only ES5 syntax with `let`, no arrow functions or block scoping |
// | Memory Efficiency    | Moved instance methods to `btn.prototype`                            |
// | Syntax Compatibility | Used `let` instead of `let` or `const`                               |
// | Conditional Logic    | Flattened ternaries where possible                                   |
// | Compatibility        | Uses the modern syntax supported by the target SMP version      |
// |----------------------------------------------------------------------------------------------
// | 06/30/2025: SAVE button is now "Button: Shortcut Run".                                      |
// | 04/14/2026: getAlternatingColor() func added to blink play btn.                        |
// -----------------------------------------------------------------------------------------------
buttons.update = function () {
	const pbo = plman.PlaybackOrder;

	const px = Math.floor(seekbar.x + ((seekbar.w - (ppt.play_btn_count * bs)) / 2));
	const fx = volbar.x + ((volbar.w - (ppt.short_btn_count * bs)) / 2);

	const vm = fb.Volume.toFixed(0);
	const vb = vm == -100 ? chrs.mute : vm < -25 ? chrs.vol0 : vm < -10 ? chrs.vol1 : vm < -4 ? chrs.vol2 : chrs.vol3;

	lfm_button();

	let playBtns = [
		{ c: 0, d: 'love',  n: lfm.n, h: lfm.h, t: 'Love this track', f: btnHandlers.love },
		{ c: 1, d: 'prev',  n: _chrToImg(chrs.prev, colors.TextNormal, fluent), h: _chrToImg(chrs.prev, colors.TextHighlight, fluent), t: 'Previous Track', f: btnHandlers.prev },
		{ c: 2, d: 'rwind', n: _chrToImg(chrs.rwind, colors.TextNormal, fluent), h: _chrToImg(chrs.rwind, colors.TextHighlight, fluent), t: 'Rewind 10 Seconds', f: btnHandlers.rwind },
		{ c: 3, d: 'play', n: _chrToImg(chrs.play, colors.TextNormal, fluent), h: _chrToImg(chrs.play, colors.TextHighlight, fluent), t: 'Click to play or pause', f: btnHandlers.playPause },
		{ c: 4, d: 'ffwd',  n: _chrToImg(chrs.ffwd, colors.TextNormal, fluent), h: _chrToImg(chrs.ffwd, colors.TextHighlight, fluent), t: 'Forward 30 Seconds', f: btnHandlers.ffwd },
		{ c: 5, d: 'next',  n: _chrToImg(chrs.next, colors.TextNormal, fluent), h: _chrToImg(chrs.next, colors.TextHighlight, fluent), t: 'Next Track', f: btnHandlers.next },
		{ c: 6, d: 'pbo',   n: _chrToImg(pbo_btn.chr[pbo], colors.TextNormal, fluent), h: _chrToImg(pbo_btn.chr[pbo], colors.TextHighlight, fluent), t: 'Playback Order: ' + pbo_btn.tip[pbo], f: btnHandlers.pbo }
	];

	let funcBtns = [
		{ c: 0, d: 'pref',   n: _chrToImg(chrs.prf, colors.TextNormal, fluent), h: _chrToImg(chrs.prf, colors.TextHighlight, fluent), t: 'Preferences', f: btnHandlers.pref },
		{ c: 1, d: 'dsp',    n: _chrToImg(chrs.dsp, colors.TextNormal, fluent), h: _chrToImg(chrs.dsp, colors.TextHighlight, fluent), t: 'DSP Prefs', f: btnHandlers.dsp },
		{ c: 2, d: 'search', n: _chrToImg(chrs.search, colors.TextNormal, fluent), h: _chrToImg(chrs.search, colors.TextHighlight, fluent), t: 'Facets Search', f: btnHandlers.search },
		{ c: 3, d: 'save',   n: _chrToImg(ppt.save_chr, colors.TextNormal, fluent), h: _chrToImg(ppt.save_chr, colors.TextHighlight, fluent), t: ppt.save_tt, f: btnHandlers.save },
		{ c: 4, d: 'skip',   n: (_cc("foo_skip") && !fb.IsMainMenuCommandChecked('Playback/Skip tracks & use bookmarks')) ? _chrToImg(chrs.skipoff, colors.TextNormal, fluent) : _chrToImg(chrs.skip, colors.TextNormal, fluent), h: _chrToImg(chrs.skip, colors.TextHighlight, fluent), t: 'Enable foo_skip component', f: btnHandlers.skip }
	];


	// === Create transport buttons ===
	for (let i = 0; i < playBtns.length; i++) {
	  let b = playBtns[i];
			make_button(new btn(b.c, b.d, b.n, b.h, b.t, b.f, px));
	}

	// === Create function buttons ===
	for (let i = 0; i < funcBtns.length; i++) {
		let b = funcBtns[i];
		make_button(new btn(b.c, b.d, b.n, b.h, b.t, b.f, fx));
	}

	// === Volume/mute button ===
  const volBtn = { c: 0, d: 'volume', n: _chrToImg(vb, colors.TextNormal, fluent), h: _chrToImg(vb, colors.TextHighlight, fluent), t: 'Volume: ' + vm + ' dB', f: btnHandlers.vol };
	make_button(new btn(volBtn.c, volBtn.d, volBtn.n, volBtn.h, volBtn.t, volBtn.f));

};

// ------------------------------------------------------------------------------------------
// | on_size function, optimized & Cleaned-Up 6/18/2025:                                    |
// ------------------------------------------------------------------------------------------
// | Change                            | Why                                                |
// | --------------------------------- | -------------------------------------------------- |
// | `Math.max(ppt.seekbar_height, 2)` | More intuitive than ternary for minimum constraint |
// | `Math.min(...)` for handle height | Clean constraint on handle size                    |
// | Consistent semicolons             | Fixed accidental comma in `arc.bg` assignment      |
// | Grouped sections                  | Logical structure: art â†’ bars â†’ buttons            |
// | Simplified comments               | Kept helpful ones, removed outdated or redundant   |
// ------------------------------------------------------------------------------------------
// | 07/06/2025: art and bar variables cleaned redundent assignments.                       |
// | 2026-05-25 12:38:35: duplicate 'over' variable declarations removed (global).          |
// ------------------------------------------------------------------------------------------

function on_size() {
		
	const bar = {h: 0, y: 0};
  const albumW = Math.floor(seekbar.x + ((seekbar.w - (ppt.play_btn_count * bs)) / 2)) - summ.x;

	panel.size();

  // Hover tests
	overTitle = mouse.x >= summ.x && mouse.x <= summ.x + summ.w && mouse.y >= summ.y && mouse.y <= summ.y + title.h();
	overArtist = mouse.x >= summ.x && mouse.x <= summ.x + albumW && mouse.y >= summ.y + title.h() && mouse.y <= summ.y + title.h() + artist.h();
	overAlbum = mouse.x >= summ.x && mouse.x <= summ.x + albumW && mouse.y >= summ.y + title.h() + artist.h() && mouse.y <= summ.y + title.h() + artist.h() + album.h();

	// Album art box
	art.h = art.w = (ppt.artsize >= 20 && ppt.artsize <= (panel.h - (art_spc * 2))) ? ppt.artsize : 60;
	art.x = art.y = art_spc;

  summ.y = art.y + ((art.h - (title.h() + artist.h() + album.h())) / 2);
  summ.w = (seekbar.x - handle.w - time.w) - summ.x;

	// Seek bar
	bar.h = Math.round(ppt.seekbar_height / 2) * 2; //Math.max(ppt.seekbar_height, 2);
	bar.y = art.y + (art_spc/2);

	arc.bar = Math.floor(bar.h / 2); // Used for FillRoundRect
	arc.bg = Math.floor(bs - _scale(4)) / 2;

	// Seekbar positioning
	seekbar.x = seekbar.w = Math.round(panel.w / 3); //One-third of panel width
	seekbar.y = bar.y;
	seekbar.h = bar.h;

	// Volume bar
	volbar.w = Math.round(panel.w / 6);
	volbar.x = Math.round(panel.w - volbar.w) - _scale(ppt.bs);
	volbar.y = bar.y;
	volbar.h = bar.h;

	// Handle
	handle.h = Math.min(Math.floor(ppt.seekbar_handle), bar.h * 2);
	handle.w = handle.h;
	handle.y = seekbar.y - ((handle.h - seekbar.h) / 2);

	// Playback buttons background and border sizing.
	pb_bg.x = Math.floor(seekbar.x + ((seekbar.w - (ppt.play_btn_count * bs)) / 2));
	pb_bg.w = (ppt.play_btn_count * bs) + _scale(6);
	
	// Shortcut buttons background and border sizing.
	short_bg.x = Math.floor(volbar.x + ((volbar.w - (ppt.short_btn_count * bs)) / 2));
	short_bg.w = (ppt.short_btn_count * bs) + _scale(6);

	// Wallpaper
	g_wallpaperImg = setWallpaperImg(panel.metadb);

	// Buttons
	buttons.update();
}

// Initialize panel geometry after all methods are defined.
on_size();
