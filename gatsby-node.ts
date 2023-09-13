import type { GatsbyNode } from "gatsby";
import {
  BlockObjectResponse,
  PageObjectResponse,
  TextRichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import path from "path";
import richTextToString from "./src/helpers/richTextToString";
import titlePropToString from "./src/helpers/titlePropToString";
import { DefaultTemplateContext } from "nebula-atoms";
import { readFile } from "fs/promises";

export const onCreateWebpackConfig: GatsbyNode["onCreateWebpackConfig"] = ({
  actions,
}) => {
  actions.setWebpackConfig({
    node: {
      fs: "empty",
    },
  });
};

export const createPages: GatsbyNode["createPages"] = async ({ actions }) => {
  const { createPage } = actions;

  const TITLE = "Nebula, solution de sites éco-conçus.";

  /*
   * 1. PAGE [& CONTENTS] RETRIEVING
   */

  const pagesCache = JSON.parse(
    await readFile("./cache/pages.json", "utf-8")
  ) as PageObjectResponse[];

  const pages = await Promise.all(
    pagesCache.map(async (page) => ({
      page,
      blocks: JSON.parse(
        await readFile(`./cache/pages/${page.id}/page.json`, "utf-8")
      ) as BlockObjectResponse[],
    }))
  );

  /*
   * 2. RENDERING SHARED PROPS
   */

  const sharedProps: Pick<
    DefaultTemplateContext,
    "bg" | "text" | "navbar" | "footer"
  > = {
    navbar: {
      title: "Nebula",
      links: [
        {
          title: "Prestations",
          path: "/prestations",
        },
        {
          title: "La solution",
          path: "/la-solution",
        },
      ],
    },
    footer: {
      links: [
        {
          title: "Accueil",
          path: "/",
        },
        {
          title: "Prestations",
          path: "/prestations",
        },
        {
          title: "La solution",
          path: "/la-solution",
        },
      ],
      contact: true,
      mentions: true,
    },
  };

  /*
   * 3. PAGE [& CONTENTS] RENDERING
   */

  pages.forEach(({ page, blocks }) => {
    const {
      Name: name,
      Url: url,
      Description: description,
      Robots: robots,
    } = page.properties;

    const pageTitle = name.type === "title" && titlePropToString(name);
    const _url =
      url.type === "rich_text"
        ? richTextToString(url.rich_text as TextRichTextItemResponse[])
        : page.id;

    createPage({
      component: path.resolve("./src/templates/default.template.tsx"),
      path: _url,
      context: {
        pageTitle,
        blocks,
        head: {
          title: `${pageTitle} | ${TITLE}`,
          description:
            description.type === "rich_text" &&
            richTextToString(
              description.rich_text as TextRichTextItemResponse[]
            ),
          favicon: "/nebula-logo.svg",
          noIndex: robots.type === "select" && robots.select?.name === "Masqué",
        },
        ...sharedProps,
        ...(["/contact", "/mentions-legales"].includes(_url)
          ? {
              scripts: ["/contact.js"],
            }
          : {}),
      } as DefaultTemplateContext,
    });
  });
};
