import { expect, type Page } from "@playwright/test";
import { presetDashboard } from "./fixtures";

/**
 * Set up the dashboard with two Job Monitor apps.
 * Call before visitApp().
 */
export async function setupJobMonitorDashboard(page: Page) {
  await presetDashboard(
    page,
    '[{"title":"Group 2","extended":true,"items":[{"title":"Job Monitor","id":"Job Monitor0","type":"Job Monitor"},{"title":"Job Monitor 2","id":"Job Monitor 21","type":"Job Monitor"}]}]',
  );
}

async function getAccessToken(page: Page): Promise<string> {
  const sessionData = await page.evaluate(() =>
    sessionStorage.getItem("oidc.vo:diracAdmin group:admin"),
  );
  if (!sessionData) {
    throw new Error("Access token not found in session storage");
  }
  return JSON.parse(sessionData).tokens.accessToken;
}

/**
 * Submit jobs to the backend using the API.
 */
export async function addJobs(page: Page, numberOfJobs: number) {
  const accessToken = await getAccessToken(page);

  for (let i = 0; i < numberOfJobs; i++) {
    const response = await page.request.post("/api/jobs/jdl", {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: ['Arguments = "jobDescription.xml -o LogLevel=INFO'],
    });
    expect(response.status()).toBe(201);
  }
}

/**
 * Create a sandbox, upload it, submit a job, and assign the sandbox as output.
 * Returns the job ID.
 *
 * Note: Input sandbox assignment is handled by DIRAC (not DiracX), so it
 * cannot be tested in the demo environment. Output sandbox assignment is
 * supported via the DiracX API.
 */
export async function addJobWithOutputSandbox(page: Page): Promise<number> {
  const accessToken = await getAccessToken(page);

  // Run in the browser: the presigned upload URL points to the demo's
  // object store
  return page.evaluate(async (accessToken) => {
    const baseUrl = window.location.origin;

    // Create random sandbox data
    const data = new Uint8Array(512);
    crypto.getRandomValues(data);

    // Compute SHA-256 checksum
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const checksum = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Step 1: Initiate sandbox upload
    const initRes = await fetch(`${baseUrl}/api/jobs/sandbox`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        checksum_algorithm: "sha256",
        checksum,
        size: data.byteLength,
        format: "tar.bz2",
      }),
    });
    if (!initRes.ok) {
      throw new Error(`Initiate sandbox upload failed: ${initRes.status}`);
    }
    const uploadInfo = await initRes.json();
    const sandboxPfn: string = uploadInfo.pfn;

    // Step 2: Upload the file to the presigned URL
    if (uploadInfo.url) {
      const formData = new FormData();
      for (const [key, value] of Object.entries(
        uploadInfo.fields as Record<string, string>,
      )) {
        formData.append(key, value);
      }
      formData.append("file", new Blob([data]), "file");
      const uploadRes = await fetch(uploadInfo.url, {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        throw new Error(`Sandbox file upload failed: ${uploadRes.status}`);
      }
    }

    // Step 3: Submit a job
    const jobRes = await fetch(`${baseUrl}/api/jobs/jdl`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        'Arguments = "jobDescription.xml -o LogLevel=INFO',
      ]),
    });
    if (!jobRes.ok) {
      throw new Error(`Job submission failed: ${jobRes.status}`);
    }
    const jobData = await jobRes.json();
    const jobId: number = jobData[0].JobID;

    // Step 4: Assign the sandbox to the job as output sandbox
    const assignRes = await fetch(
      `${baseUrl}/api/jobs/${jobId}/sandbox/output`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sandboxPfn),
      },
    );
    if (!assignRes.ok) {
      throw new Error(`Sandbox assignment failed: ${assignRes.status}`);
    }

    return jobId;
  }, accessToken);
}

/**
 * Ensure there are at least `minNumberOfJobs` in the table.
 * If not, add jobs and refresh. Call after the table is visible.
 */
export async function ensureMinimumJobs(page: Page, minNumberOfJobs: number) {
  await expect(page.getByTestId("loading-skeleton")).toHaveCount(0);

  const noData = page.getByText("No data or no results match your filters.");
  if ((await noData.count()) > 0) {
    // No data available, adding jobs
    await addJobs(page, minNumberOfJobs);
    // Wait for the jobs to be created on the backend
    await page.waitForTimeout(2000);
  } else {
    // Data available, checking if enough jobs are present
    const pagination = await page
      .locator(".MuiTablePagination-displayedRows")
      .textContent();
    const lastNumber = parseInt(pagination?.split(" ").pop() || "0");

    if (lastNumber < minNumberOfJobs) {
      await addJobs(page, minNumberOfJobs - lastNumber);
    } else {
      await expect(page.locator("table")).toBeVisible();
    }
  }

  // Refresh the jobs
  await page.getByTestId("refresh-search-button").click();
}

/** The Job ID shown in the given row of the job table. */
export async function jobIdOfRow(page: Page, row: "first" | "last") {
  const rows = page.locator("table tbody tr[data-index]");
  const text = await (row === "first" ? rows.first() : rows.last())
    .locator("td")
    .nth(1)
    .textContent();
  return parseInt(text?.trim() ?? "", 10);
}

/** Scroll the virtualised job table to its last row. */
export async function scrollTableToBottom(page: Page) {
  await page
    .getByTestId("table-scroller")
    .evaluate((el) => el.scrollTo(0, el.scrollHeight));
}
