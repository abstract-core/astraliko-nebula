import type { GatsbyNode } from "gatsby";
import { Client } from "@notionhq/client";
import {
  PageObjectResponse,
  TextRichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import path from "path";
import richTextToString from "./src/helpers/richTextToString";
import titlePropToString from "./src/helpers/titlePropToString";
import { DefaultTemplateContext } from "statikon";
// import datePropToDate from "./src/helpers/datePropToDate";
import provisionContent from "./src/helpers/provisionContent";
import { COLORS } from "./src/enums/colors.enum";

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

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

  const pages = (
    await notion.databases.query({
      database_id: process.env.DATABASE_ID as string,
      filter: { property: "Contexte", select: { equals: "Page" } },
    })
  ).results as PageObjectResponse[];

  const _pages = await Promise.all(
    pages.map((page) => provisionContent(page, notion))
  );

  /** These instructions shouldn't be activated for basic website. */

  /* const contents = (
    await notion.databases.query({
      database_id: process.env.DATABASE_ID as string,
      filter: { property: "Contexte", select: { equals: "Contenu" } },
    })
  ).results as PageObjectResponse[];

  const _contents = await Promise.all(
    contents.map((page) => provisionContent(page, notion))
  ); */

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
    },
  };

  /*
   * 3. PAGE [& CONTENTS] RENDERING
   */

  _pages.forEach(({ page, blocks }) => {
    const { Name: name, Url: url } = page.properties;

    createPage({
      component: path.resolve("./src/templates/default.template.tsx"),
      path:
        url.type === "rich_text"
          ? richTextToString(url.rich_text as TextRichTextItemResponse[])
          : page.id,
      context: {
        title: name.type === "title" && titlePropToString(name),
        blocks,
        ...sharedProps,
      } as DefaultTemplateContext,
    });
  });

  /* _contents.forEach(({ page: content, blocks }) => {
    const {
      Name: name,
      Url: url,
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
        createdAt: createdAt.type === "date" && datePropToDate(createdAt),
        publishedAt: publishedAt.type === "date" && datePropToDate(publishedAt),
        editedAt: editedAt.type === "date" && datePropToDate(editedAt),
        blocks,
        ...sharedProps,
      } as DefaultTemplateContext,
    });
  }); */
};
