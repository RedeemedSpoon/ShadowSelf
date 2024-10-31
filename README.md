<p align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./Frontend/src/lib/images/logo/logo-white-text.svg">
  <img alt="ShadowSelf" src="./Frontend/src/lib/images/logo/logo-black-text.svg" width="60%">
</picture>
</p>

## ShadowSelf Overview

[ShadowSelf](https://shadowself.io) is a web application that allows any individual to safeguard their privacy and anonymity in the digital age. With it, you can generate synthetic identities, complete with functional phone numbers, virtual cards, email addresses, proxies, metadata, names, nationalities and way more exciting stuff....

By utilizing such fabricated identities, you can register for online services while concealing you true identity, offering a significant step toward protecting you privacy & right to remain anonymous online.

The project is still in beta phase and is still under heavy development. You can subscribe to our [waitlist](https://shadowself.io/#waitlist) to get notified when it's ready.

## Running Locally

To get started, clone the repository and change the directory with the following command:

```bash
git clone https://github.com/RedeemedSpoon/ShadowSelf.git
cd ShadowSelf
```

### Frontend

Install the dependencies:

```bash
cd Frontend
bun install # or npm install
```

Start the server:

```bash
bun dev # or npm run dev
```

If you want to build the project and preview it locally, run the following command:

```bash
bun make-build # or npm run make-build
bun preview # or npm run preview
```

### Backend

Install the dependencies: (Note that [bun](https://bun.sh/) is required to run the backend)

```bash
cd Backend
bun install
```

Initialize the PostgreSQL database:

```bash
psql -U postgres -f database.sql
```

Start the server:

```bash
bun dev
```

To build the project and compile it, run the following command:

```bash
bun make-build
```

### Linting/Formatting

Install the dependencies:

```bash
bun install
```

Run the linter:

```bash
bun lint # or npm run lint
```

Run the formatter:

```bash
bun format # or npm run format
```

### Quick Tmux Session

If you use tmux and want to quickly start a session with the project, run the following command:

```bash
chmod +x tmux.sh # if script does not work
./tmux.sh
```

You can add the script to your $PATH to run it from anywhere with the following command:

```bash
cp tmux.sh /usr/bin/{script} # Change {script} to the name of script you want to call it
```

## Contribution

If you'd like to contribute, please [open an issue](https://github.com/RedeemedSpoon/ShadowSelf/issues) or [open a pull request](https://github.com/RedeemedSpoon/ShadowSelf/pulls).

## License

This project is licensed under the GPL-3.0 License. This license allows you to use, modify, and distribute this project. To view a copy of this license, visit [https://www.gnu.org/licenses/gpl-3.0.html](https://www.gnu.org/licenses/gpl-3.0.html).
