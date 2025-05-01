import subprocess
import os

def run(cmd, cwd=None):
    return subprocess.run(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True, text=True)

def get_submodules():
    result = run("git config --file .gitmodules --get-regexp path")
    submodules = []
    for line in result.stdout.strip().splitlines():
        _, path = line.split(" ", 1)
        submodules.append(path)
    return submodules

def update_submodules():
    run("git submodule init")
    run("git submodule update --recursive --remote")

    updated = []
    for sub in get_submodules():
        print(f"Checking submodule: {sub}")
        sub_path = os.path.abspath(sub)
        old_hash = run("git rev-parse HEAD", cwd=sub_path).stdout.strip()
        run("git fetch", cwd=sub_path)
        run("git merge origin/main", cwd=sub_path)  # adjust branch if needed
        new_hash = run("git rev-parse HEAD", cwd=sub_path).stdout.strip()
        if old_hash != new_hash:
            print(f"Updated {sub}: {old_hash[:7]} → {new_hash[:7]}")
            run(f"git add {sub}")
            updated.append(sub)
        else:
            print(f"No changes in {sub}")
    return updated

def commit_and_push(updated_subs):
    if updated_subs:
        msg = "updated " + ", ".join(updated_subs)
        run(f'git commit -m "{msg}"')
        run("git push")
        print(f"Committed and pushed: {msg}")
    else:
        print("No updates to commit.")

if __name__ == "__main__":
    updated = update_submodules()
    commit_and_push(updated)