import type { Extension } from '@codemirror/state';
import { EditorView, Decoration, ViewPlugin } from '@codemirror/view';
import type { ViewUpdate, DecorationSet } from '@codemirror/view';
import { language, syntaxHighlighting, syntaxTree } from '@codemirror/language';
import { tagHighlighter, tags } from '@lezer/highlight';

const rancherHighlight = tagHighlighter([
  { tag: [tags.propertyName, tags.definition(tags.propertyName)], class: 'cm-rancher-key' },
  { tag: [tags.string, tags.attributeValue], class: 'cm-rancher-string' },
  { tag: [tags.keyword, tags.atom, tags.bool, tags.null], class: 'cm-rancher-keyword' },
  { tag: tags.comment, class: 'cm-rancher-comment' }
]);

const booleanMark = Decoration.mark({ class: 'cm-rancher-keyword' });
const booleanValue = /^(?:true|false|on|off|yes|no)$/i;

function yamlBooleans(view: EditorView): DecorationSet {
  const marks: { from: number; to: number }[] = [];

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if (node.name === 'Literal' && node.node.parent?.name !== 'Key' && booleanValue.test(view.state.sliceDoc(node.from, node.to))) {
          marks.push({ from: node.from, to: node.to });
        }
      }
    });
  }

  return Decoration.set(marks.map(({ from, to }) => booleanMark.range(from, to)), true);
}

const yamlBooleanHighlight = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = yamlBooleans(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged || update.startState.facet(language) !== update.state.facet(language)) {
      this.decorations = yamlBooleans(update.view);
    }
  }
}, { decorations: (plugin) => plugin.decorations });

// light theme colours, used where the page does not set the --rc-cm-* custom properties, e.g. outside the dashboard theme
const FALLBACK_COLORS = {
  bg:        '#FFFFFF',
  selection: '#E0E0E0',
  key:       '#1A4FA8',
  string:    '#8A4B10',
  keyword:   '#9A2B94',
  comment:   '#5B616D',
  text:      '#16181D',
  gutter:    '#5B626C',
};

const color = (name: keyof typeof FALLBACK_COLORS): string => `var(--rc-cm-${ name }, ${ FALLBACK_COLORS[name] })`;

const rancherSharedTheme = EditorView.theme({
  '.cm-content':                { caretColor: color('key') },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: color('key') },
  '.cm-rancher-key':            {
    color:      color('key'),
    fontWeight: '600'
  },
  '.cm-rancher-string':  { color: color('string') },
  '.cm-rancher-keyword': { color: color('keyword') },
  '.cm-rancher-comment': {
    color:     color('comment'),
    fontStyle: 'italic'
  }
});

const rancherEditorTheme = EditorView.theme({
  '&': {
    color:           color('text'),
    backgroundColor: color('bg')
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: color('selection') },
  '.cm-gutters':                                                                                                                {
    color:           color('gutter'),
    backgroundColor: color('bg'),
    borderRight:     'none'
  },
  '.cm-activeLineGutter': { backgroundColor: 'transparent' },
  '.cm-foldPlaceholder':  {
    backgroundColor: 'transparent',
    border:          'none',
    borderRadius:    '0',
    color:           'inherit',
    fontSize:        '12px',
    fontStyle:       'normal',
    lineHeight:      '1',
    margin:          '0 1px',
    padding:         '0'
  }
});

const rancherInputCursorTheme = EditorView.theme({ '.cm-cursor, .cm-dropCursor': { borderLeftWidth: '2px' } });

const rancherHighlighting = syntaxHighlighting(rancherHighlight);
const rancherSyntax: Extension = [rancherSharedTheme, rancherHighlighting, yamlBooleanHighlight];

export const rancherTheme: Extension = [
  rancherEditorTheme,
  rancherSyntax
];

export const rancherInputTheme: Extension = [
  rancherInputCursorTheme,
  rancherSyntax
];
