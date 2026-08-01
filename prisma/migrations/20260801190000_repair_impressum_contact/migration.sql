-- Replace Joomla's unresolved email-obfuscation output and the retired site
-- address in both the canonical and retained legacy Impressum records.
UPDATE "Page"
SET
  "content" = replace(
    replace(
      replace(
        "content",
        'E-Mail: kolping-ramsenDiese E-Mail-Adresse ist vor Spambots geschützt! Zur Anzeige muss JavaScript eingeschaltet sein.',
        'E-Mail: [kolping-ramsen@gmx.de](mailto:kolping-ramsen@gmx.de)'
      ),
      'Internet: [www.kolping-ramsen.de](http://www.kolping-ramsen.de/)',
      'Internet: [kolping-ramsen.logge.top](https://kolping-ramsen.logge.top)'
    ),
    'Internet: [www.kolping-ramsen.de](http://www.kolping-ramsen.de)',
    'Internet: [kolping-ramsen.logge.top](https://kolping-ramsen.logge.top)'
  ),
  "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE
  "slug" IN ('impressum', 'kontakt/impressum')
  AND (
    "content" LIKE '%Diese E-Mail-Adresse ist vor Spambots geschützt!%'
    OR "content" LIKE '%http://www.kolping-ramsen.de%'
  );
