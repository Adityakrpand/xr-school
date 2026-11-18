import { expect, test } from "@playwright/test";

const route = "/simulations/thermoplastics-thermosetting";

test("completes the workshop with corrective feedback and one retry", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(route);
  await page
    .getByRole("button", { name: "Enter the virtual moulding workshop" })
    .click();

  await page.getByRole("button", { name: /Scan PET bottle/ }).click();
  await page.getByRole("button", { name: /Scan Disc A/ }).click();
  await page.getByRole("button", { name: /Scan Disc B/ }).click();
  await page
    .getByRole("button", { name: "Operate the moulding machine →" })
    .click();

  for (const name of [
    "Load polythene pellets",
    "Pull the Mould lever",
    "Cool and open the mould",
    "Trace the round edge",
  ]) {
    await page.getByRole("button", { name }).click();
  }
  await page.getByRole("button", { name: "Try reshaping Disc A →" }).click();

  for (const name of [
    "Press with heat off",
    "Turn on simulated heat",
    "Press into star mould",
    "Switch heat off and cool",
  ]) {
    await page.getByRole("button", { name }).click();
  }
  await page
    .getByRole("button", { name: "Test Disc B with the same steps →" })
    .click();

  await page.getByLabel("Before setting to after setting").fill("1");
  await page.getByRole("button", { name: "Turn on simulated heat" }).click();
  await page.getByRole("button", { name: "Press into star mould" }).click();
  await page
    .getByRole("button", { name: "Magnify the permanent links" })
    .click();
  await page
    .getByRole("button", { name: "Compare everyday plastics →" })
    .click();

  await page
    .getByRole("button", { name: /Replay both reheating tests/ })
    .click();
  for (const name of [
    /Polythene bag/,
    /PVC pipe/,
    /Bakelite casing/,
    /Melamine plate/,
  ]) {
    await page.getByRole("button", { name }).click();
  }
  await page
    .getByRole("button", { name: "Begin the Workshop Challenge →" })
    .click();

  await page
    .getByRole("button", { name: "Thermosetting", exact: true })
    .first()
    .click();
  await expect(page.getByText(/Both objects feel rigid/)).toBeVisible();
  await page
    .getByRole("button", { name: "Thermoplastic", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Thermosetting", exact: true })
    .click();
  await page.getByRole("button", { name: "Make the missing badge →" }).click();

  await page
    .getByRole("button", { name: /Heat both unlabelled discs/ })
    .click();
  await page
    .getByRole("button", { name: "Choose Sample B — stayed set" })
    .click();
  await expect(page.getByText(/One retry available:/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Choose Sample B — stayed set" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Choose Sample A — softened" })
    .click();

  await expect(
    page.getByRole("heading", { name: "Star Badge Completed!" }),
  ).toBeVisible();
  await expect(
    page.getByText("3/3 challenge points", { exact: false }),
  ).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("keeps the mobile layout usable and touch targets accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  await page
    .getByRole("button", { name: "Enter the virtual moulding workshop" })
    .click();

  const metrics = await page.evaluate(() => {
    const controls = [...document.querySelectorAll("button, a, input")]
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    return {
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      undersizedControls: controls.filter(
        (rect) => rect.width < 44 || rect.height < 44,
      ).length,
    };
  });

  expect(metrics).toEqual({
    horizontalOverflow: false,
    undersizedControls: 0,
  });
});

test("shows a non-scoring guided result when five minutes expire", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto(route);
  await page
    .getByRole("button", { name: "Enter the virtual moulding workshop" })
    .click();

  await page.clock.fastForward(301_000);

  await expect(
    page.getByRole("heading", { name: "Guided Result Completed" }),
  ).toBeVisible();
  await expect(page.getByText(/does not add challenge points/)).toBeVisible();
  await expect(
    page.getByText("0/3 challenge points", { exact: false }),
  ).toBeVisible();
});
