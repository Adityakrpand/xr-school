import { expect, test } from "@playwright/test";

test("pollination requires a hands-on observation before advancing", async ({
  page,
}) => {
  await page.goto("/simulations/pollination");
  await page.getByRole("button", { name: /View in Browser/ }).click();

  const next = page.getByRole("button", { name: "Next Stage →" });
  await expect(next).toBeDisabled();
  await page.getByRole("button", { name: "Inspect the flower parts" }).click();
  await expect(page.getByText(/Observation complete:/)).toBeVisible();
  await expect(next).toBeEnabled();
  await next.click();
  await expect(
    page.getByRole("button", { name: "Release pollen from the anthers" }),
  ).toBeVisible();
});

test("circuit actions provide feedback and drive stage progression", async ({
  page,
}) => {
  await page.goto("/simulations/circuit");
  await page.getByRole("button", { name: /View in Browser/ }).click();

  await page.getByRole("button", { name: /OFF/ }).click();
  await expect(page.getByText(/Circuit closed: electrons flow/)).toBeVisible();
  await expect(page.getByText(/Stage 2 \/ 4/)).toBeVisible();

  await page.getByRole("button", { name: "50 Ω" }).click();
  await expect(page.getByText(/Resistance changed to 50 ohms/)).toBeVisible();
  await expect(page.getByText(/Stage 3 \/ 4/)).toBeVisible();
});

test("synthetic fibres unlocks manufacturing after active scanning", async ({
  page,
}) => {
  await page.goto("/simulations/synthetic-fibres-types");
  await page
    .getByRole("button", { name: "Enter the futuristic fibre laboratory" })
    .click();

  for (const material of [/Cotton cloth/, /Woollen cloth/, /Silk fabric/]) {
    await page.getByRole("button", { name: material }).click();
  }
  const next = page.getByRole("button", {
    name: "Enter the manufacturing chamber →",
  });
  await expect(next).toBeEnabled();
  await next.click();
  await expect(
    page.getByRole("button", { name: /Start: soften polymer/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Replay narration" }),
  ).toBeVisible();
});

test("solubility predictions are selectable and narrated", async ({ page }) => {
  await page.goto("/simulations/soluble-insoluble-substances");
  await page
    .getByRole("button", { name: "Enter Professor Aqua's laboratory" })
    .click();

  const dissolve = page.getByRole("button", {
    name: "Sugar: will dissolve",
  });
  await dissolve.click();
  await expect(dissolve).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/Sugar: prediction recorded/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Replay narration" }),
  ).toBeVisible();
});
