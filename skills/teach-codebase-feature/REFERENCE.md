# Reference: diagram-links.js

The core script that makes sequence diagram text clickable. Place after each `<pre class="mermaid">` as a sibling `<script class="diagram-links">` with JSON mapping.

## How It Works

1. Waits for Mermaid to finish rendering all SVGs (polls `document.querySelectorAll('.mermaid svg')`)
2. Finds all `<script class="diagram-links">` elements
3. For each, walks back to find the preceding `.mermaid` container
4. Parses the JSON mapping (keys = text substrings, values = vscode:// URLs)
5. Sorts keys longest-first for best matching
6. Iterates all `<text>` and `<tspan>` elements in the SVG
7. For each text element, finds the longest-matching key that's a substring of the text content
8. Attaches: `cursor: pointer`, underline, click handler (`window.location.href = url`), hover color
9. Uses capture-phase event listener to beat any Mermaid-internal handlers

## JSON Mapping Tips

```json
{
  "ActivityManagementService": "vscode://file/C:/dev/pics/src/.../ActivityManagementService.cs:21",
  "CreateAsync": "vscode://file/C:/dev/pics/src/.../ActivityManagementService.cs:49",
  "POST /git/blobs": "vscode://file/C:/dev/pics/src/.../GitHubActivitiesClient.cs:130",
  "Guard 1": "vscode://file/C:/dev/pics/src/.../ActivityManagementService.cs:149",
  "ON FAILURE": "vscode://file/C:/dev/pics/src/.../ActivityManagementService.cs:333"
}
```

- Keys are matched via `content.indexOf(key) !== -1`
- Longer keys win — "ActivityManagementService" beats "Activity"
- Map EVERYTHING: participant names, action messages, note text, response labels
- Participant alias in Mermaid (`participant AMS as ActivityManagementService`) renders as "ActivityManagementService" in the SVG — use the full name as key

## Common Pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| Nothing clickable | Script runs before Mermaid renders | Increase initial wait (500ms default) |
| Popup menu on click | Used Mermaid `link` directive | Remove `link` lines, use JSON mapping |
| `classDiagram` syntax error | Special chars in class body (`?`, `{repo}`) | Switch to flowchart with subgraphs |
| Text doesn't match | Mermaid wraps long text into multiple `<tspan>` | Use shorter keys that fit in one tspan |
| Clicks don't fire | `securityLevel` not set to `'loose'` | Add to mermaid.initialize() |

## Testing Template

Create this to verify before shipping. Delete after confirming.

```html
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Click Test</title></head>
<body>
<pre class="mermaid">
sequenceDiagram
    participant A as ServiceName
    A->>B: doSomething()
</pre>
<script type="application/json" class="diagram-links">
{"ServiceName": "vscode://file/C:/test:1", "doSomething": "vscode://file/C:/test:2"}
</script>
<div id="log" style="background:#111;color:#0f0;padding:1rem;font-family:monospace;white-space:pre-wrap;min-height:100px;">Log:</div>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true,securityLevel:'loose'});</script>
<script>
// Debug version — logs matches and clicks
(function(){
  var log=document.getElementById('log');
  function l(m){log.textContent+='\n'+m}
  function go(){
    var scripts=document.querySelectorAll('script.diagram-links');
    l('Found '+scripts.length+' mapping scripts');
    scripts.forEach(function(s){
      if(s.dataset.applied)return;
      var c=s.previousElementSibling;
      while(c&&!c.classList.contains('mermaid'))c=c.previousElementSibling;
      if(!c){l('ERROR: no container');return}
      var svg=c.querySelector('svg');
      if(!svg){l('ERROR: no SVG');return}
      s.dataset.applied='true';
      var map=JSON.parse(s.textContent);
      var keys=Object.keys(map).sort(function(a,b){return b.length-a.length});
      var els=svg.querySelectorAll('text,tspan');
      l('Text elements: '+els.length+', Keys: '+keys.length);
      var n=0;
      els.forEach(function(el){
        var t=el.textContent.trim();if(!t||t.length<2)return;
        for(var i=0;i<keys.length;i++){
          if(t.indexOf(keys[i])!==-1){
            n++;el.style.cursor='pointer';el.style.textDecoration='underline';
            el.setAttribute('data-url',map[keys[i]]);
            el.addEventListener('click',function(e){
              e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
              var u=this.getAttribute('data-url');l('CLICK: '+u);window.location.href=u;
            },true);
            break;
          }
        }
      });
      l('Matched: '+n);
      if(!n){l('--- All text: ---');els.forEach(function(e){var t=e.textContent.trim();if(t)l('  "'+t+'"')})}
    });
  }
  setTimeout(function check(){
    var s=document.querySelectorAll('.mermaid svg').length;
    var m=document.querySelectorAll('.mermaid').length;
    l('SVGs: '+s+'/'+m);
    if(s>=m&&m>0)setTimeout(go,200);else setTimeout(check,300);
  },600);
})();
</script>
</body></html>
```
