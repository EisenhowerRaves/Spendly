import asyncio
from playwright.async_api import async_playwright


URL = "file:///C:/Users/eisen/Spendly/expense-tracker.html"


async def main() -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        console_lines: list[str] = []
        page_errors: list[str] = []
        req_failed: list[str] = []

        def on_console(msg) -> None:
            try:
                console_lines.append(f"{msg.type}: {msg.text}")
            except Exception:
                console_lines.append("console: <unprintable>")

        def on_page_error(err) -> None:
            try:
                page_errors.append(str(err))
            except Exception:
                page_errors.append("<unprintable pageerror>")

        def on_req_failed(req) -> None:
            try:
                failure_obj = None
                failure_attr = getattr(req, "failure", None)
                if callable(failure_attr):
                    try:
                        failure_obj = failure_attr()
                    except Exception:
                        failure_obj = None
                else:
                    failure_obj = failure_attr

                err_text = None
                if failure_obj is not None:
                    err_text = getattr(failure_obj, "error_text", None) or getattr(
                        failure_obj, "errorText", None
                    )

                req_failed.append(f"{req.method} {req.url} -> {err_text or 'FAILED'}")
            except Exception as e:
                try:
                    req_failed.append(
                        f"<unprintable requestfailed> ({type(e).__name__}: {e})"
                    )
                except Exception:
                    req_failed.append("<unprintable requestfailed>")

        page.on("console", on_console)
        page.on("pageerror", on_page_error)
        page.on("requestfailed", on_req_failed)

        resp = await page.goto(URL, wait_until="load")
        await page.wait_for_timeout(2000)

        vis = await page.evaluate(
            """() => {
            const auth = document.getElementById('auth-screen');
            const app = document.getElementById('app');
            const reg = document.getElementById('register-modal');
            function isShown(el){
              if(!el) return false;
              const cs = getComputedStyle(el);
              const r = el.getBoundingClientRect();
              return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
            }
            const title = document.title;
            const hasLoginBtn = !!document.getElementById('login-btn');
            const loginBtnText = hasLoginBtn ? document.getElementById('login-btn').textContent : null;
            return {
              title,
              authVisible: isShown(auth),
              appVisible: isShown(app),
              registerOpen: reg?.classList.contains('open') || false,
              loginBtnText,
              bodyTextSample: document.body?.innerText?.trim()?.slice(0, 200) || ''
            };
        }"""
        )

        clicked: dict[str, object] = {}
        if await page.locator("#login-btn").count():
            await page.locator("#login-email").fill("test@example.com")
            await page.locator("#login-password").fill("badpass")
            await page.locator("#login-btn").click()
            await page.wait_for_timeout(1000)
            clicked["login_clicked"] = True

        if await page.locator("text=Create new account").count():
            await page.locator("text=Create new account").click()
            await page.wait_for_timeout(500)
            clicked["register_link_clicked"] = True

        # If app is visible, try open add modal from header.
        if vis.get("appVisible"):
            try:
                # buttons: import, calendar, plus, trash, bot, logout
                await page.locator("header .header-actions button").nth(2).click()
                await page.wait_for_timeout(500)
                clicked["add_modal_clicked"] = True
            except Exception as e:
                clicked["add_modal_clicked_error"] = str(e)

        vis2 = await page.evaluate(
            """() => {
            const auth = document.getElementById('auth-screen');
            const app = document.getElementById('app');
            const add = document.getElementById('add-modal');
            const csv = document.getElementById('csv-modal');
            const reg = document.getElementById('register-modal');
            function isShown(el){
              if(!el) return false;
              const cs = getComputedStyle(el);
              const r = el.getBoundingClientRect();
              return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
            }
            return {
              authVisible: isShown(auth),
              appVisible: isShown(app),
              addModalOpen: add?.classList.contains('open') || false,
              csvModalOpen: csv?.classList.contains('open') || false,
              registerOpen: reg?.classList.contains('open') || false,
            };
        }"""
        )

        print("=== NAVIGATION ===")
        print("url:", page.url)
        print("response_status:", resp.status if resp else None)
        print("=== VISIBLE (initial) ===")
        print(vis)
        print("=== ACTIONS ===")
        print(clicked)
        print("=== VISIBLE (after) ===")
        print(vis2)
        print("=== CONSOLE ===")
        for l in console_lines:
            print(l)
        print("=== PAGEERROR ===")
        for e in page_errors:
            print(e)
        print("=== REQUESTFAILED ===")
        for r in req_failed:
            print(r)

        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())

