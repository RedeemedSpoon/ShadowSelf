# Contributing to Shadowself

First off, thanks for taking the time to contribute!

All types of contributions are encouraged and valued. See the [Table of Contents](#table-of-contents) for different ways to help and details about how this project handles them. Please make sure to read the relevant section before making your contribution. It will make it a lot easier for the developers and smooth out the experience for all involved. We looks forward to your contributions.

> And if you like the project, but just don't have time to contribute, that's fine. There are other easy ways to support the project and show your appreciation, which we would also be very happy about:
>
> - Star the project
> - Post about it online
> - Refer this project in your project's README
> - Mention the project at local meetups and tell your friends/colleagues

## Table of Contents

- [I Have a Question](#i-have-a-question)
- [I Want To Contribute](#i-want-to-contribute)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)
- [Style Guides](#style-guides)
- [Commit Messages](#commit-messages)
- [Attribution](#attribution)

## I Have a Question

Before you ask a question, it is best to search for existing [Issues](https://github.com/RedeemedSpoon/ShadowSelf/issues) that might help you. In case you have found a suitable issue and still need clarification, you can write your question in this issue. It is also advisable to search the internet for answers first.

If you then still feel the need to ask a question and need clarification, we recommend the following:

- Open an [Issue](https://github.com/RedeemedSpoon/ShadowSelf/issues/new).
- Provide as much context as you can about what you're running into.
- Provide project and platform versions, depending on what seems relevant.

We will then take care of the issue as soon as possible.

## I Want To Contribute

> #### Legal Notice
>
> When contributing to this project, you must agree that you have authored 100% of the content, that you have the necessary rights to the content and that the content you contribute may be provided under the project licence.

#### Types of Contributions

- **Code Contributions:** Whether it's fixing a bug, adding a feature, or improving performance, contributions to the codebase are highly valued.
- **Bug Reports:** Reporting bugs, errors, or issues is vital to improving the project. Detailed bug reports help us quickly identify and fix problems.
- **Feature Suggestions:** If you have an idea for a new feature or enhancement, we encourage you to share it with us.
- **Testing:** Help by testing features or bug fixes and providing feedback on your experience.

To ensure a smooth contribution process, please follow the guidelines below:

### How to Start

1. **Fork the Repository**  
   Fork the repository to your GitHub account. You can then make changes in your own forked version.

2. **Create a Branch**  
   Create a new branch for your changes. Avoid making changes directly to the `master` branch.

3. **Make Your Changes**  
   Make the necessary changes in your branch. Be sure to follow the [Style Guides](#style-guides) to keep the codebase consistent.

4. **Test Your Changes**  
   Use temporary tests to verify changed behavior, then delete them and any test-only artifacts or commands. Do not commit test files. For frontend changes, inspect every affected route in a browser at desktop and mobile sizes and exercise the changed behavior. Report anything you could not validate.

5. **Run Code Formatter**
   Run `bun format` and `bun lint` from the repository root and fix errors. Run `bun check` for TypeScript changes. For critical or broad changes, also run `bun run build` and preview when practical.

6. **Commit your Changes**
   Commit your changes with clear, concise commit messages following the [commit message guidelines](#commit-messages).

7. **create a Pull Request**  
   Push your changes to your fork and create a pull request (PR) to the main repository. Be sure to describe the changes you made and link any relevant issues.

We will review your PR and provide feedback. If everything looks good, your changes will be merged into the main project!

## Reporting Bugs

#### Before Submitting a Bug Report

A good bug report shouldn't leave others needing to chase you up for more information. Therefore, we ask you to investigate carefully, collect information and describe the issue in detail in your report. Please complete the following steps in advance to help us fix any potential bug as fast as possible.

- Make sure that you are using the latest version.
- Determine if your bug is really a bug and not an error on your side e.g. using incompatible environment components/versions. If you are looking for support, you might want to check [this section](#i-have-a-question)).
- To see if other users have experienced (and potentially already solved) the same issue you are having, check if there is not already a bug report existing for your bug or error in the [bug tracker](https://github.com/RedeemedSpoon/ShadowSelf/issues?q=label%3Abug).
- Also make sure to search the internet (including Stack Overflow) to see if users outside of the GitHub community have discussed the issue.
- Collect information about the bug :
  - Stack trace (Traceback)
  - OS, Platform and Version (Windows, Linux, macOS, x86, ARM)
  - Version of the interpreter, compiler, SDK, runtime environment, package manager, depending on what seems relevant.
  - Possibly your input and the output
  - Can you reliably reproduce the issue? And can you also reproduce it with older versions?

#### How Do I Submit a Good Bug Report?

We use GitHub issues to track bugs and errors. If you run into an issue with the project:

- Open an [Issue](https://github.com/RedeemedSpoon/ShadowSelf/issues/new). (Since we can't be sure at this point whether it is a bug or not, we ask you not to talk about a bug yet and not to label the issue.)
- Explain the behavior you would expect and the actual behavior.
- Please provide as much context as possible and describe the _reproduction steps_ that someone else can follow to recreate the issue on their own. This usually includes your code. For good bug reports you should isolate the problem and create a reduced test case.
- Provide the information you collected in the previous section.

Once it's filed:

- We will label the issue accordingly.
- We will try to reproduce the issue with your provided steps. If there are no reproduction steps or no obvious way to reproduce the issue, we will ask you for those steps and mark the issue as `needs-repro`. Bugs with the `needs-repro` tag will not be addressed until they are reproduced.
- If we are able to reproduce the issue, it will be marked `needs-fix`, as well as possibly other tags (such as `critical`), and the issue will be left to be [implemented by someone](#your-first-code-contribution).

## Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for Shadowself, **including completely new features and minor improvements to existing functionality**. Following these guidelines will help maintainers and the community to understand your suggestion and find related suggestions.

#### Before Submitting an Enhancement

- Make sure that you are using the latest version.
- Perform a [search](https://github.com/RedeemedSpoon/ShadowSelf/issues) to see if the enhancement has already been suggested. If it has, add a comment to the existing issue instead of opening a new one.
- Find out whether your idea fits with the scope and aims of the project. It's up to you to make a strong case to convince us of the merits of this feature. Keep in mind that we want features that will be useful to the majority of our users and not just a small subset.

#### How Do I Submit a Good Enhancement Suggestion?

Enhancement suggestions are tracked as [GitHub issues](https://github.com/RedeemedSpoon/ShadowSelf/issues).

- Use a **clear and descriptive title** for the issue to identify the suggestion.
- Provide a **step-by-step description of the suggested enhancement** in as many details as possible.
- **Describe the current behavior** and **explain which behavior you expected to see instead** and why. At this point you can also tell which alternatives do not work for you.
- You may want to **include screenshots or screen recordings** which help you demonstrate the steps or point out the part which the suggestion is related to. You can use [LICEcap](https://www.cockos.com/licecap/) to record GIFs on macOS and Windows, and the built-in [screen recorder in GNOME](https://help.gnome.org/users/gnome-help/stable/screen-shot-record.html.en) or [SimpleScreenRecorder](https://github.com/MaartenBaert/ssr) on Linux.
- **Explain why this enhancement would be useful** to most Shadowself users. You may also want to point out the other projects that solved it better and which could serve as inspiration.

## Style Guides

Follow every applicable rule in [AGENTS.md](AGENTS.md). It is the source of truth for implementation and validation requirements.

- Match the surrounding syntax, naming, and conventions. Write self-explanatory code without inline comments.
- Separate logical steps with blank lines. Leave a blank line between exported type aliases and interfaces, including consecutive one-line types.
- Aim for functions under 60 lines, lines within the configured 160-character Prettier width, nesting below five levels, and components with one clear responsibility. Use these as review thresholds; keep cohesive logic together.
- Keep constants in the existing constants modules and types in the existing type modules. Use each application's configured aliases. Reuse existing helpers and avoid new utility files unless the existing files are cluttered or the feature needs substantial helper code.
- Prefer the smallest clear implementation that handles all required states. Remove replaced code; do not retain legacy contracts, old-format fallbacks, or parallel implementations.
- When changing a request, response, validation rule, or shared concept, inspect and update every frontend and backend consumer together. Keep status codes and error shapes consistent.
- Outline a plan before work that crosses subsystems or carries meaningful risk. Obtain approval before installing dependencies.
- Update the fresh database initialization schema directly when persistent data changes. Do not add migrations, backfills, or database fields for transient or derivable state.

# Commit Messages

Commit messages should be clear, concise, and follow these guidelines:

- **Keep It Short:** Provide only the essential information. A commit message should be brief and to the point.
- **Titlecase All Words:** Capitalize the first letter of each word in the commit message (except for articles, conjunctions, and prepositions).
- **Be Specific, Not Vague:** Avoid generic messages like "Fixes" or "Updates." Clearly state what was changed or fixed.

### Example Commit Messages

- **Good:**
  - "Fix Bug In User Authentication Flow"
  - "Add New Validation For Email Input"
  - "Refactor Database Query Logic"
- **Bad:**
  - "I'm Sorry..."
  - "Update Code"
  - "Misc Changes"

## Attribution

This guide is based on the [contributing.md](https://contributing.md) project.
