import React, {useCallback, useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import WebView from 'react-native-webview';
import {colors} from '../theme/colors';

const SIGNATURE_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 8px; font-family: -apple-system, sans-serif; background: #fafafa; }
    #c { display: block; width: 100%; height: 180px; border: 1px solid #ccc; border-radius: 8px; background: #fff; touch-action: none; }
    .row { margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap; }
    button { padding: 10px 16px; border-radius: 8px; border: none; font-size: 15px; }
    #clear { background: #e0e0e0; color: #333; }
    #done { background: #c00; color: #fff; }
    .hint { font-size: 12px; color: #666; margin-top: 6px; }
  </style>
</head>
<body>
  <canvas id="c" width="800" height="360"></canvas>
  <div class="row">
    <button type="button" id="clear">Clear</button>
    <button type="button" id="done">Use this signature</button>
  </div>
  <p class="hint">Sign with your finger above, then tap &quot;Use this signature&quot;.</p>
  <script>
    (function () {
      var canvas = document.getElementById('c');
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      var drawing = false;
      var lx = 0, ly = 0;
      function pos(e) {
        var r = canvas.getBoundingClientRect();
        var t = e.touches ? e.touches[0] : e;
        return {
          x: (t.clientX - r.left) * (canvas.width / r.width),
          y: (t.clientY - r.top) * (canvas.height / r.height)
        };
      }
      function start(e) {
        if (e.cancelable) e.preventDefault();
        drawing = true;
        var p = pos(e);
        lx = p.x; ly = p.y;
      }
      function move(e) {
        if (!drawing) return;
        if (e.cancelable) e.preventDefault();
        var p = pos(e);
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        lx = p.x; ly = p.y;
      }
      function end() { drawing = false; }
      canvas.addEventListener('touchstart', start, { passive: false });
      canvas.addEventListener('touchmove', move, { passive: false });
      canvas.addEventListener('touchend', end);
      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', move);
      canvas.addEventListener('mouseup', end);
      canvas.addEventListener('mouseleave', end);
      document.getElementById('clear').onclick = function () {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      };
      document.getElementById('done').onclick = function () {
        var data = canvas.toDataURL('image/png');
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'signature', data: data }));
      };
    })();
  </script>
</body>
</html>`;

export interface CustomerSignaturePadProps {
  /** PNG data URL from canvas, or null if cleared */
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

/**
 * In-embedded WebView signature capture for invoices (no extra native deps).
 */
export function CustomerSignaturePad({value, onChange}: CustomerSignaturePadProps) {
  const webRef = useRef<WebView>(null);

  const onMessage = useCallback(
    (event: {nativeEvent: {data: string}}) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data) as {
          type?: string;
          data?: string;
          message?: string;
        };
        if (msg.type === 'signature' && typeof msg.data === 'string') {
          onChange(msg.data);
        }
      } catch {
        /* ignore */
      }
    },
    [onChange],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Customer signature (required)</Text>
      <Text style={styles.sub}>
        Have the customer sign on the device, then tap &quot;Use this signature&quot; in the box below.
      </Text>
      <WebView
        ref={webRef}
        source={{html: SIGNATURE_HTML}}
        onMessage={onMessage}
        style={styles.web}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
      />
      {value ? (
        <View style={styles.savedRow}>
          <Text style={styles.savedText}>Signature captured.</Text>
          <TouchableOpacity onPress={() => onChange(null)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text style={styles.clearLink}>Clear & re-sign</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 20,
    alignSelf: 'stretch',
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: colors.darkGray,
    fontWeight: '600',
    marginBottom: 4,
  },
  sub: {
    fontSize: 13,
    color: colors.gray,
    marginBottom: 8,
  },
  web: {
    width: '100%',
    height: 300,
    backgroundColor: 'transparent',
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  savedText: {
    fontSize: 14,
    color: colors.darkGray,
  },
  clearLink: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
});
