"""Exercise the real X11 example and preserve screenshots for CI review."""

import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time

from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parent.parent
ENTRY = ROOT / "examples/official/X11/X11.cjs"
OUTPUT = Path(sys.argv[1]).resolve()
OUTPUT.mkdir(parents=True, exist_ok=True)


def command(*args):
    """Run a bounded X11 utility and return its text output."""
    return subprocess.check_output(args, text=True, timeout=10).strip()


def find_window(process):
    """Wait for the example's mapped parent without hiding startup errors."""
    deadline = time.monotonic() + 15
    while time.monotonic() < deadline:
        assert process.poll() is None, "Example exited before mapping its window"
        result = subprocess.run(
            ["xdotool", "search", "--onlyvisible", "--name", "^SFML Window$"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode == 0:
            return result.stdout.splitlines()[0]
        time.sleep(0.1)
    raise AssertionError("Example did not map its X11 parent within 15 seconds")


def snapshot(window, name):
    """Capture the parent and both native children from the X server."""
    path = OUTPUT / name
    command("import", "-window", window, str(path))
    return Image.open(path).convert("RGB")


def changed_pixels(first, second):
    """Count changed pixels, ignoring single-channel equality."""
    return sum(pixel != (0, 0, 0) for pixel in
               ImageChops.difference(first, second).getdata())


def verify_scene(window):
    """Check real geometry, cube colors and independently animated views."""
    tree = command("xwininfo", "-id", window, "-tree")
    (OUTPUT / "window-tree.txt").write_text(tree + "\n")
    matches = re.findall(r"(0x[0-9a-f]+).*?310x310\+(\d+)\+(\d+)", tree)
    children = {(int(x), int(y)): handle for handle, x, y in matches}
    assert set(children) == {(10, 10), (330, 10)}, tree

    # Allow both GL contexts to render, then compare frames 1.5 seconds apart.
    time.sleep(2)
    first = snapshot(window, "x11-before.png")
    time.sleep(1.5)
    second = snapshot(window, "x11.png")
    assert first.size == second.size == (650, 330), second.size
    views = [(10, 10, 320, 320), (330, 10, 640, 320)]
    changes = []
    cubes = []
    for box in views:
        before, after = first.crop(box), second.crop(box)
        colors = after.getcolors(310 * 310)
        background = sum(n for n, (r, g, b) in colors
                         if r < 5 and 120 <= g <= 135 and 120 <= b <= 135)
        cube = sum(n for n, rgb in colors
                   if sorted(rgb)[0] < 10 and sorted(rgb)[1] > 240)
        assert background > 60000, f"Missing teal background: {background}"
        assert cube > 3000, f"Missing colored cube: {cube}"
        changed = changed_pixels(before, after)
        assert changed > 500, f"View is not animating: {changed}"
        changes.append(changed)
        cubes.append(cube)
    # The same cube drawn at two speeds must have visibly different poses.
    difference = changed_pixels(second.crop(views[0]), second.crop(views[1]))
    assert difference > 1000, f"Views have identical poses: {difference}"
    assert changes[0] > changes[1], f"Left cube is not faster: {changes}"
    return children, {
        "size": list(second.size),
        "cubePixels": cubes,
        "animatedPixels": changes,
        "differentPosePixels": difference,
    }


def run_case(name, target, capture=False):
    """Inject a real key or signal, then require a clean, timely shutdown."""
    with (OUTPUT / f"{name}.log").open("w") as log:
        process = subprocess.Popen(
            ["node", str(ENTRY)], cwd=OUTPUT, stdout=log, stderr=log,
        )
        try:
            window = find_window(process)
            if capture:
                children, result = verify_scene(window)
            else:
                time.sleep(0.3)
                tree = command("xwininfo", "-id", window, "-tree")
                children = {
                    (int(x), int(y)): handle
                    for handle, x, y in re.findall(
                        r"(0x[0-9a-f]+).*?310x310\+(\d+)\+(\d+)", tree
                    )
                }
                result = {}
            if target == "signal":
                process.send_signal(2)
            else:
                handle = window if target == "parent" else children[target]
                # KeyPress alone avoids sending KeyRelease to a destroyed XID.
                command("xdotool", "keydown", "--window", handle, "a")
            assert process.wait(timeout=10) == 0, f"{name}: nonzero exit"
            remaining = subprocess.run(
                ["xwininfo", "-id", window], capture_output=True, timeout=5,
            )
            assert remaining.returncode != 0, "Parent survived example shutdown"
            return result
        finally:
            if process.poll() is None:
                process.kill()
                process.wait(timeout=5)


def main():
    """Run display failure, rendering, event routing and ownership checks."""
    missing = subprocess.run(
        ["node", str(ENTRY)], cwd=OUTPUT,
        env={**os.environ, "DISPLAY": ""}, capture_output=True, text=True,
        timeout=10,
    )
    (OUTPUT / "no-display.log").write_text(missing.stdout + missing.stderr)
    assert missing.returncode == 1, missing
    assert "Cannot open X11 display" in missing.stderr, missing.stderr

    result = run_case("parent-key", "parent", capture=True)
    run_case("left-key", (10, 10))
    run_case("right-key", (330, 10))
    run_case("sigint", "signal")
    result["passed"] = [
        "no DISPLAY", "parent and child geometry", "both cubes rendered",
        "different animation speeds", "parent key exit", "left child key exit",
        "right child key exit", "SIGINT exit", "native window cleanup",
    ]
    (OUTPUT / "results.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
