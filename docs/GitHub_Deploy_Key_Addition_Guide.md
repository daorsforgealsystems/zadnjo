# Adding SSH Deploy Key to GitHub Repository for Submodules

This guide provides a step-by-step process to add the specified SSH public key as a deploy key to a GitHub repository. This is essential for preparing the build system to handle future private submodules, ensuring secure read-only access without exposing write permissions.

## Prerequisites

Before proceeding, ensure you have the following:

- **GitHub Account Access**: Administrative privileges on the target GitHub repository (owner or collaborator with admin rights).
- **SSH Public Key**: The following RSA public key is provided for use:
  ```
  ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDagzuMQrSmdqqG1EYVNxqAGkW2MtrzvdtrtxIcpuMi4P4OTlbtiNv1eSHtQO/Ks7Vuwukt25haFPsbvXJteQFFYw5LPnKmTnFgaVNOlQYkOCFESoNpfdLnSr5FTSK7EyhKF9yd0+TWklLDQ5S1v/Pm1vNDQQUZDcfowCHF0BaZICp+HpsJr9NBmXECEERxabMqZr4GKF0pKEiHkobupigvF8iYWdG2IQEd4cU8OW6e24ygQPBgc6EfMFSyfjEZOw3f3kVR+AJZ7yRbNfms5MWKCRAew/40tIkofHZQ8hcDH5ENq2stlkYQfdlgnbdE8VQ2ZtAyqPxJxKfj2xDz1JF0KjVr/9zvGh3Xi8hRO8vuBepcgugKxdiGbYThAQVMwf9JBH+afDT8UMYPxCPRUz8t3iihRLvvrT4plV1gXmKEfjyzMifSZf3fjmFxBMMqLIOcCs+XfT7SnBc4TYjLjCyYz/+NlJEc6/E5mD50vkPV23lzfTe/B+dAJKCys4lDaDNWhBIRYlJpqVwHYDZzHQCWS7LBHr/+Q+jK5idsvXJQ6AtFHdYOpeYE2/6iyiALabVVAnjxo8w2CCQTJxongjVyNhE0Bx97L/yZnVwjU12IX5MEFwpy7Alx1zM7QV9NBYZzFnLjW2hLYvbh2Nd+/0JV2YVHnvKNAykGpkHDtGqhFw==
  ```
  - This key should be securely stored and not shared publicly.
- **Repository Setup**: Confirm the repository is private if submodules will be private. Deploy keys are repository-specific, so this process must be repeated for each submodule repository.
- **Git Configuration**: Ensure your local Git environment is configured with SSH keys if needed for testing.

## Step-by-Step Process

Follow these steps to add the deploy key. This process grants read-only access by default, which is suitable for submodules. If write access is required for specific use cases, you can enable it during key addition (not recommended for security reasons).

1. **Log in to GitHub**:
   - Open your web browser and navigate to [GitHub.com](https://github.com).
   - Sign in with your GitHub account credentials.

2. **Navigate to the Repository**:
   - Go to the target repository where you want to add the deploy key (e.g., `https://github.com/your-username/your-repo`).
   - Ensure you have admin access; if not, contact the repository owner.

3. **Access Repository Settings**:
   - Click on the **Settings** tab at the top of the repository page (visible if you have admin rights).
   - In the left sidebar, scroll down and click on **Deploy keys** under the "Security" section.

4. **Add the Deploy Key**:
   - On the Deploy keys page, click the **Add deploy key** button (green button in the top right).
   - In the "Title" field, enter a descriptive name for the key, such as `Deploy Key for Submodules` or `Build System Access Key`. This helps identify the key's purpose.
   - In the "Key" field, paste the entire SSH public key provided above.
   - **Permissions**: Uncheck the **Allow write access** box to keep it read-only (recommended for submodules to prevent accidental modifications). If write access is necessary, check this box—but only if required and approved.
   - Click **Add key** to save the deploy key.

5. **Verify the Key Addition**:
   - After adding, the key should appear in the list of deploy keys with its title, fingerprint, and permissions.
   - If the key is invalid (e.g., incorrect format), GitHub will display an error—double-check the pasted key for accuracy.

6. **Repeat for Each Submodule Repository**:
   - Deploy keys are specific to each repository. For each private submodule repository in your build system, repeat steps 1–5.
   - Maintain a record of which repositories have this key for auditing purposes.

## Post-Addition Considerations

- **Security Best Practices**:
  - Rotate the SSH key periodically and update it in GitHub if compromised.
  - Limit the number of deploy keys per repository to reduce exposure.
  - Use organization-level SSH keys if managing multiple repositories.

- **Testing the Setup**:
  - After adding the key, test access by attempting to clone or fetch the repository using SSH (e.g., `git clone git@github.com:your-username/your-repo.git`).
  - If submodules are involved, ensure the parent repository's `.gitmodules` file references the submodule URLs correctly.

- **Troubleshooting**:
  - If access fails, verify the key format, ensure no extra spaces or line breaks, and confirm the repository allows SSH access.
  - Check GitHub's audit log under repository settings for any issues related to key addition.

This process ensures your build system can securely access private submodules without requiring full repository credentials. For further assistance with Git submodule configuration, refer to the official [Git Submodules Documentation](https://git-scm.com/book/en/v2/Git-Tools-Submodules).