-- The imported Joomla start-page menu item incorrectly became a redirect from
-- the native homepage to a subsection. The native homepage must stay canonical.
DELETE FROM "Redirect"
WHERE "fromPath" = '/' AND "toPath" = '/theater';
