---
👁️ Eye discipline:{{STD_ID}}:
  image: registry.gitlab.com/dev.rachuna/artifacts/containers/python:1.2.1
  extends:
    - .dyscypline
  variables:
    STD_DOMAIN: {{DOMAIN_PATH}}
    STD_ID: {{STD_ID}}
    DOCS_MD_FILE_PATH: standards/{{DOMAIN_PATH}}/{{STD_ID}}/README.md
    STD_CHECK_SCRIPT: /tmp/discipline/standards/$STD_DOMAIN/$STD_ID/bin/checks
  script:
    - |
      if [ ! -f "$STD_CHECK_SCRIPT" ]; then
        echo "Standard check script not found: $STD_CHECK_SCRIPT"
        exit 120
      fi

      bash "$STD_CHECK_SCRIPT"
  allow_failure:
    exit_codes:
      - 101
      - 120
