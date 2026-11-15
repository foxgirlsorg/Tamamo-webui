#!/usr/bin/env bash
# Writes the GitHub release notes for a tag to stdout, built from commit
# messages. Used by .github/workflows/docker.yml after the image is pushed.
#
#   .github/release-notes.sh v1.2.3
#
# Tamamo and its web UI are released together under the same tag, so the
# notes list both container images and the commits of both repositories
# since their previous tag. The other repository is cloned read-only; if it
# has no such tag yet, its section is left out.
set -euo pipefail

tag="${1:?usage: release-notes.sh <tag>}"
version="${tag#v}"
self="${GITHUB_REPOSITORY:-foxgirlsorg/Tamamo}"
server="${GITHUB_SERVER_URL:-https://github.com}"

case "${self,,}" in
  */tamamo-webui) other="${self%/*}/Tamamo" ;;
  *)              other="${self%/*}/Tamamo-webui" ;;
esac

# section <dir> <repo> <title>: the repo's commits from its previous tag to $tag.
section() {
  local dir="$1" repo="$2" title="$3" prev range
  prev="$(git -C "$dir" describe --tags --abbrev=0 --match 'v*' "$tag^" 2>/dev/null || true)"
  range="${prev:+$prev..}$tag"
  echo "### $title"
  echo
  git -C "$dir" log --reverse --no-merges \
    --format="- [\`%h\`]($server/$repo/commit/%H) %s" "$range"
  echo
  if [ -n "$prev" ]; then
    changelog+=("[$title $prev...$tag]($server/$repo/compare/$prev...$tag)")
  fi
}

changelog=()
otherdir="$(mktemp -d)"
trap 'rm -rf "$otherdir"' EXIT
have_other=false
if git clone --quiet --filter=blob:none --no-checkout "$server/$other.git" "$otherdir" 2>/dev/null &&
  git -C "$otherdir" rev-parse --verify --quiet "refs/tags/$tag" >/dev/null; then
  have_other=true
fi

name_of() { case "${1,,}" in */tamamo-webui) echo "Web UI" ;; *) echo "Tamamo" ;; esac; }

cat <<EOF
## Containers

| Image | Pull |
| --- | --- |
| [tamamo]($server/orgs/foxgirlsorg/packages/container/package/tamamo) (the proxy) | \`docker pull ghcr.io/foxgirlsorg/tamamo:$version\` |
| [tamamo-webui]($server/orgs/foxgirlsorg/packages/container/package/tamamo-webui) (the optional admin web UI) | \`docker pull ghcr.io/foxgirlsorg/tamamo-webui:$version\` |

Images are built for \`linux/amd64\` and \`linux/arm64\`. To update with Docker Compose:

\`\`\`bash
docker compose pull && docker compose up -d
\`\`\`

## Changes

EOF

section . "$self" "$(name_of "$self")"
if $have_other; then
  section "$otherdir" "$other" "$(name_of "$other")"
fi

if [ ${#changelog[@]} -gt 0 ]; then
  printf '**Full changelog:** %s\n' "$(IFS='|'; echo "${changelog[*]}" | sed 's/|/ · /g')"
fi
