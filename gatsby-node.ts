import type { GatsbyNode } from "gatsby";
import {
  BlockObjectResponse,
  PageObjectResponse,
  TextRichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import path from "path";
import richTextToString from "./src/helpers/richTextToString";
import titlePropToString from "./src/helpers/titlePropToString";
import { DefaultTemplateContext } from "statikon";
// import datePropToDate from "./src/helpers/datePropToDate";
import { COLORS } from "./src/enums/colors.enum";
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
    "bg" | "text" | "navbar" | "contents" | "footer"
  > = {
    bg: COLORS.SPACE,
    text: COLORS.STAR,
    navbar: {
      bg: COLORS.YANG,
      text: COLORS.LIGHT,
      links: [
        {
          title: "Prestations",
          path: "/prestations",
        },
      ],
    },
    contents: [],
    footer: {
      bg: COLORS.YANG,
      text: COLORS.LIGHT,
      a: COLORS.STAR,
      links: [
        {
          title: "Accueil",
          path: "/",
        },
        {
          title: "Prestations",
          path: "/prestations",
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

    createPage({
      component: path.resolve("./src/templates/default.template.tsx"),
      path:
        url.type === "rich_text"
          ? richTextToString(url.rich_text as TextRichTextItemResponse[])
          : page.id,
      context: {
        title: name.type === "title" && titlePropToString(name),
        blocks,
        head: {
          description:
            description.type === "rich_text" &&
            richTextToString(
              description.rich_text as TextRichTextItemResponse[]
            ),
          noIndex: robots.type === "select" && robots.select?.name === "Masqué",
        },
        ...sharedProps,
      } as DefaultTemplateContext,
    });
  });

  /* _contents.forEach(({ page: content, blocks }) => {
    const {
      Name: name,
      Url: url,
      Description: description,
      Robots: robots,
      ["Créé le"]: createdAt,
      ["Publié le"]: publishedAt,
      ["Édité le"]: editedAt,
    } = content.properties;
    createPage({
      component: path.resolve("./src/templates/default.template.tsx"),
      path:
        url.type === "rich_text"
          ? richTextToString(url.rich_text as TextRichTextItemResponse[])
          : content.id,
      context: {
        title: name.type === "title" && titlePropToString(name),
        head: {
          description:
            description.type === "rich_text" &&
            richTextToString(
              description.rich_text as TextRichTextItemResponse[]
            ),
          noIndex: robots.type === "select" && robots.select?.name === "Masqué",
        },
        createdAt: createdAt.type === "date" && datePropToDate(createdAt),
        publishedAt: publishedAt.type === "date" && datePropToDate(publishedAt),
        editedAt: editedAt.type === "date" && datePropToDate(editedAt),
        blocks,
        ...sharedProps,
      } as DefaultTemplateContext,
    });
  }); */
};
