import "mocha";
import { assert } from "chai";
import { before } from "mocha";
import { HeaderTemplateRenderer, HighlightTemplateRenderer } from "../src/template";
import { fileSystemHandler, resolvePathToData, TestDateFactory } from "./helpers";
import { Document, Highlight } from "../src/api/models";
import { HeaderTemplateType, HighlightTemplateType } from "../src/template/templateTypes";
import { TemplateLoader } from "../src/template/loader";

describe("HeaderTemplateType", () => {
    it('verifies the default template', () => {
        assert.equal(new HeaderTemplateType().defaultTemplate(), `- **URL:** {{ source_url }}
- **Author:** {{ author }}
- **Tags:** #{{ category }}
- **Date:** [[{{ updated }}]]
---
`);
});
})

describe("HighlightTemplateType", () => {
    it('verifies the default template', () => {
        assert.equal(new HighlightTemplateType().defaultTemplate(), `{{ text }} %% highlight_id: {{ id }} %%
{%- if note %}
Note: {{ note }}
{%- endif %}
`);
});
})

describe('TemplateLoader', () => {
    it('loads template without the md extension', async () => {
        const loader = new TemplateLoader(
            resolvePathToData('Readwise Note Highlight'),
            fileSystemHandler(),
            new HighlightTemplateType()
        );

        assert.equal(await loader.selectTemplate(), `{{ text }} \`highlight_id: {{ id }}\` %% location: {{ location }} %%
{% if note -%}
Note: {{ note }}
{%- endif %}
`);
    });

    it('loads template with the md extension', async () => {
        const loader = new TemplateLoader(
            resolvePathToData('Readwise Note Highlight.md'),
            fileSystemHandler(),
            new HighlightTemplateType()
        );

        assert.equal(await loader.selectTemplate(), `{{ text }} \`highlight_id: {{ id }}\` %% location: {{ location }} %%
{% if note -%}
Note: {{ note }}
{%- endif %}
`);
    });
});


describe("HeaderTemplateRenderer", () => {
    const handler = fileSystemHandler();
    let templateRenderer: HeaderTemplateRenderer;
    let customTemplateRenderer: HeaderTemplateRenderer;

    before(async () => {
        templateRenderer = await HeaderTemplateRenderer.create(null, handler);
        customTemplateRenderer = await HeaderTemplateRenderer.create(resolvePathToData('Readwise Note Header'), handler);
    })

    context('render', () => {
        let doc: Document;
        before(() => {
            doc = new Document({
                id: 10,
                title: 'Welcome to my note',
                author: 'renehernandez.io',
                num_highlights: 5,
                updated: '2021-04-14',
                highlights_url: 'https://readwise.io',
                source_url: 'https://readwise.io',
                category: 'article'
            },
            new TestDateFactory()
            );
        });

        it('renders default template with doc', async () => {
            assert.equal(await templateRenderer.render(doc), `- **URL:** https://readwise.io
- **Author:** renehernandez.io
- **Tags:** #article
- **Date:** [[2021-04-14]]
---
`);
        });

        it('renders custom template with doc', async () => {
            assert.equal(await customTemplateRenderer.render(doc), `- **URL:** https://readwise.io
- **Author:** renehernandez.io
- **Tags:** #Article #Inbox
- **Date:** [[2021-04-14]]
---
`);
        });
    });
});


describe("HighlightTemplateRenderer", () => {
    const handler = fileSystemHandler();
    let templateRenderer: HighlightTemplateRenderer;
    let customTemplateRenderer: HighlightTemplateRenderer;

    before(async () => {
        templateRenderer = await HighlightTemplateRenderer.create(null, handler);
        customTemplateRenderer = await HighlightTemplateRenderer.create(resolvePathToData('Readwise Note Highlight'), handler);
    });

    context('render', () => {
        let highlight: Highlight;
        before(() => {
            highlight = new Highlight({
                id: 10,
                book_id: 5,
                text: "Looks important. It's super <great>",
                note: "It really looks important. Can't wait for it",
                url: 'https://readwise.io',
                location: 1,
            });
        });

        it('renders default template with doc', async () => {
            assert.equal(await templateRenderer.render(highlight), `Looks important. It's super <great> %% highlight_id: 10 %%
Note: It really looks important. Can't wait for it
`);
        });

        it('renders custom template with doc', async () => {
            assert.equal(await customTemplateRenderer.render(highlight), `Looks important. It's super <great> \`highlight_id: 10\` %% location: 1 %%
Note: It really looks important. Can't wait for it
`);
        });

        it('adds highlight_id if not present on template', async () => {
            let customTemplateWithoutIdRenderer = await HighlightTemplateRenderer.create(resolvePathToData('Readwise Note Highlight Missing Id'), handler);
            assert.equal(await customTemplateWithoutIdRenderer.render(highlight), `Looks important. It's super <great> %% location: 1 %%
Note: It really looks important. Can't wait for it
%% highlight_id: 10 %%
`);
        });
    });
});