import { expect, test } from "@playwright/test";

const route = "/simulations/thermoplastics-thermosetting";

test("completes the two-disc workshop with safety feedback and transfer challenges", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(route);
  await page
    .getByRole("button", { name: "Enter the virtual moulding workshop" })
    .click();

  for (const name of [
    "Pick up and rotate Disc A",
    "Pick up and rotate Disc B",
    "Open the task card",
  ]) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
  }
  await page.getByRole("button", { name: "Explore what plastics are" }).click();

  for (const name of [
    "Squeeze the polythene bag",
    "Rotate the rigid PVC pipe",
    "Focus the enlarged polymer model",
    "Observe how the mould gives shape",
  ]) {
    await page.getByRole("button", { name }).click();
  }
  await page
    .getByRole("button", { name: "Test Disc A in the enclosed machine" })
    .click();
  await expect(
    page.getByText("Awaiting prediction", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Changes shape" }).click();

  for (const name of [
    "Load Disc A with virtual tongs",
    "Close and lock the safety cover",
    "Test the star mould while cool",
    "Run Heat and Mould",
    "Cool until Safe to Open",
    "Open and remove the star",
  ]) {
    await page.getByRole("button", { name }).click();
  }
  await page
    .getByRole("button", { name: "Test Disc B with the same steps" })
    .click();
  await page.getByRole("button", { name: "Stays round" }).click();

  for (const name of [
    "Load Disc B with virtual tongs",
    "Close and lock the safety cover",
    "Run the approved heat-and-mould cycle",
    "Try the higher-heat safety limit",
    "Compare the disc with the star cavity",
    "Cool until Safe to Open",
  ]) {
    await page.getByRole("button", { name }).click();
  }
  await expect(page.getByText(/Bakelite stayed round/i)).toBeVisible();
  await page.getByRole("button", { name: "Compare everyday plastics" }).click();

  await page.getByLabel("Cool to heated molecular model").fill("1");
  await page
    .getByRole("button", { name: /Replay both reheating tests/ })
    .click();
  for (const name of [
    /Polythene bag/,
    /PVC pipe/,
    /Bakelite handle/,
    /Melamine plate/,
  ]) {
    await page.getByRole("button", { name }).click();
  }
  await page.getByRole("button", { name: "View the learning summary" }).click();
  await page
    .getByRole("button", { name: "Complete the Materials Display" })
    .click();

  await page
    .getByRole("button", { name: "Thermosetting", exact: true })
    .first()
    .click();
  await expect(page.getByText(/appearance or stiffness/i)).toBeVisible();
  await page
    .getByRole("button", { name: "Thermoplastic", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Thermoplastic", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Thermosetting", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Thermosetting", exact: true })
    .click();
  await page.getByRole("button", { name: "Reshape the Display Tag" }).click();

  await page
    .getByRole("button", { name: "Choose the set Bakelite disc" })
    .click();
  await expect(page.getByRole("alert").getByText(/already set/i)).toBeVisible();
  await page.getByRole("button", { name: "Choose the polythene star" }).click();
  for (const name of [
    "Load the polythene star with tongs",
    "Close and lock the safety cover",
    "Heat and mould the rectangle",
    "Cool until Safe to Open",
    "Open and install the tag",
  ]) {
    await page.getByRole("button", { name }).click();
  }
  await page
    .getByRole("button", { name: "Choose the Saucepan Handle" })
    .click();
  await page
    .getByRole("button", { name: "Choose ready-made Polythene handle" })
    .click();
  await expect(
    page.getByRole("alert").getByText(/heat resistance/i),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Choose ready-made Bakelite handle" })
    .click();

  await expect(
    page.getByRole("heading", { name: "Materials Display Complete" }),
  ).toBeVisible();
  await expect(
    page.getByText("6/6 challenge points", { exact: false }),
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

test("shows a non-scoring guided result when 5:45 expires", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto(route);
  await page
    .getByRole("button", { name: "Enter the virtual moulding workshop" })
    .click();

  await page.clock.fastForward(346_000);

  await expect(
    page.getByRole("heading", { name: "Guided Result Completed" }),
  ).toBeVisible();
  await expect(page.getByText(/does not add challenge points/)).toBeVisible();
  await expect(
    page.getByText("0/6 challenge points", { exact: false }),
  ).toBeVisible();
});
