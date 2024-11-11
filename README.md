<p align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./Frontend/src/lib/images/logo/logo-white-text.svg">
  <img alt="ShadowSelf" src="./Frontend/src/lib/images/logo/logo-black-text.svg" width="60%">
</picture>
</p>

## ShadowSelf Overview

[ShadowSelf](https://shadowself.io) is a web application that allows any individual to safeguard their privacy and anonymity in the digital age. With it, you can generate synthetic identities, complete with functional phone numbers, virtual cards, email addresses, proxies, metadata, names, nationalities and way more exciting stuff....

By utilizing such fabricated identities, you can register for online services while concealing you true identity, offering a significant step toward protecting you privacy & right to remain anonymous online.

## Running Locally

### Requirements

- `Bun` as the runtime, dependency manager and bundler, needed for the backend
- `PostgreSQL` as the database, configured for the backend

### Frontend

- `bun install` To install all the dependencies

- `bun dev` To start the development server

- `bun run build` To build the project

- `bun preview` To preview the project locally

- `bun start` To start a production-ready server

### Backend

- `bun install` To install all the dependencies

- `psql -U postgres -f database.sql` To initialize the database

- `bun dev` To start the development backend server

- `bun run build` To build and compile the project

- `./server` To start a production-ready server

### Linting/Formatting

- `bun install` To install both eslint and prettier

- `bun lint` To run the linter

- `bun format` To run the formatter

### Quick Tmux Session

If you use tmux and want to quickly start a session with the project, run the following command:

```bash
chmod +x tmux.sh # if script does not work
./tmux.sh
```

You can add the script to your $PATH to run it from anywhere with the following command:

```bash
sudo cp tmux.sh /usr/bin/{script} # Change {script} to the name of script you want to call it
```

## Contribution

If you'd like to contribute, please [open an issue](https://github.com/RedeemedSpoon/ShadowSelf/issues) or [open a pull request](https://github.com/RedeemedSpoon/ShadowSelf/pulls).

## License

This project is licensed under the GPL-3.0 License. This license allows you to use, modify, and distribute this project. To view a copy of this license, visit [https://www.gnu.org/licenses/gpl-3.0.html](https://www.gnu.org/licenses/gpl-3.0.html).
