import subprocess

def sh(cmd, cwd=None):
    return subprocess.run(cmd, cwd=cwd, shell=True, text=True, capture_output=True)

def submodules():
    out = sh("git config --file .gitmodules --get-regexp path").stdout
    return [line.split()[1] for line in out.strip().splitlines()]

def hash_at(path):
    return sh("git rev-parse HEAD", cwd=path).stdout.strip()

def main():
    print("〖 Updating submodules 〗")
    subs = submodules()
    before = {s: hash_at(s) for s in subs}

    sh("git fetch --recurse-submodules --update-head-ok --merge")

    after = {s: hash_at(s) for s in subs}
    updated = [s for s in subs if before[s] != after[s]]

    if not updated:
        print("✔ Already up to date.")
        return

    for s in updated:
        print(f"↪ {s} updated.")
        sh(f"git add {s}")

    msg = "updated " + ", ".join(updated)
    sh(f'git commit -m "{msg}"')
    sh("git push")
    print(f"⫸ Pushed: {msg}")

if __name__ == "__main__":
    main()
    # This script is intended to be run from the root of the repository.
    # It updates all submodules, commits the changes, and pushes to the remote repository.