from playwright.sync_api import Page, expect

def test_auth_pages(page: Page):
    """
    This test verifies that the signup and login pages are rendered correctly.
    """
    # 1. Navigate to the signup page.
    page.goto("http://localhost:5173/signup")

    # 2. Assert that the heading is visible.
    expect(page.get_by_role("heading", name="Create an Account")).to_be_visible()

    # 3. Take a screenshot of the signup page.
    page.screenshot(path="jules-scratch/verification/signup-page.png")

    # 4. Navigate to the login page.
    page.goto("http://localhost:5173/login")

    # 5. Assert that the heading is visible.
    expect(page.get_by_role("heading", name="Login to your Account")).to_be_visible()

    # 6. Take a screenshot of the login page.
    page.screenshot(path="jules-scratch/verification/login-page.png")
