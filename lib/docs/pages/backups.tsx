import { A, C, Callout, CodeBlock, Fields, H2, H3, P, Step, Steps, Table, Ul } from "@/components/docs/prose";

export function DatabaseBackups() {
  return (
    <>
      <P>
        Backups are logical dumps of individual databases, taken on the server with each engine’s own tool, encrypted before they touch disk,
        and kept on the server, in off-server storage (S3-compatible or Google Drive), or both.
      </P>

      <H2>What a backup is</H2>
      <Table
        head={["Engine", "Tool", "File"]}
        rows={[
          ["PostgreSQL", <C key="t">pg_dump -Fc</C>, <C key="f">*.pgdump.enc</C>],
          ["MySQL", <C key="t">mysqldump</C>, <C key="f">*.sql.gz.enc</C>],
          ["MariaDB", <C key="t">mariadb-dump</C>, <C key="f">*.sql.gz.enc</C>],
          ["Redis", <C key="t">redis-cli --rdb</C>, <C key="f">*.rdb.gz.enc</C>],
        ]}
      />
      <Ul>
        <li>
          Every file is encrypted with <strong>AES-256</strong> using a key that the control plane generates once and keeps encrypted. The key
          reaches the server only through the job-secrets channel, never on a command line.
        </li>
        <li>A SHA-256 checksum is recorded for every file and checked before any restore.</li>
        <li>
          Local copies live in <C>/var/lib/vpspilot-backups</C>.
        </li>
        <li>Dumps are limited to three hours.</li>
      </Ul>

      <H2>Schedules</H2>
      <P>Each database instance has its own policy:</P>
      <Fields
        rows={[
          ["enabled", "bool", "Turn scheduled backups on or off."],
          ["every_hours", "1–720 · 24", "Interval between backups."],
          ["keep", "1–365 · 7", "Successful backups kept per database. Older ones are deleted, locally and from storage."],
          ["databases", "list", "Which databases to back up. Defaults to the instance's default database plus those created through VPSPilot."],
        ]}
      />
      <CodeBlock
        lang="http"
        code={`
PUT /api/v1/backups/policies/{instance_id}
{ "enabled": true, "every_hours": 6, "keep": 28 }`}
      />
      <P>
        The API’s background loop starts backups when they are due. If the control plane is down at that moment, the backup runs as soon as
        it is back.
      </P>

      <H2>Manual backups</H2>
      <P>
        Take one before a risky migration with <strong>Back up now</strong>, or through the API. Leave out <C>database</C> to back up every
        database in the policy.
      </P>
      <CodeBlock lang="http" code={`POST /api/v1/backups/run\n{ "instance_id": "4d1e…", "database": "app" }`} />

      <H2 id="app-files">App file backups</H2>
      <P>
        Databases aren&apos;t the only thing worth keeping. The <strong>File Backups</strong> section of an app backs up what it keeps between
        deploys (see <A href="/docs/deployments/applications#data-folder">files that survive deploys</A>): a Docker app&apos;s data folder,
        a systemd app&apos;s shared folder, or a Compose project&apos;s named volumes.
      </P>
      <Ul>
        <li>One encrypted <C>.tar.gz.enc</C> per backup (AES-256, the same key as database backups), stored and uploaded the same way.</li>
        <li>Schedules, retention, <strong>Back up now</strong> and off-server storage work as for databases.</li>
        <li>
          <strong>Verify</strong> decrypts the backup and reads every file. <strong>Restore</strong> stops the app, empties the folder or
          volumes, puts the files back and starts it again.
        </li>
        <li>
          Files are copied as they are: a database running inside a Compose project should be backed up as a database, not from its volume.
        </li>
      </Ul>
      <CodeBlock
        lang="http"
        code={`
PUT  /api/v1/backups/apps/{app_id}/policy   { "enabled": true, "every_hours": 24, "keep": 7 }
POST /api/v1/backups/apps/{app_id}/run`}
      />
      <P>Needs agent 1.1.4 or later.</P>

      <H2>Staleness alerts</H2>
      <P>
        The <strong>Backups stale or failing</strong> alert rule fires as soon as a scheduled backup fails, or when a database or app has had
        no successful backup for 36 hours. Adjust the threshold in <A href="/docs/operations/monitoring">Monitoring</A>.
      </P>
    </>
  );
}

export function Restore() {
  return (
    <>
      <P>A backup is only useful if it restores. VPSPilot can prove that it does, and restore either over the original database or next to it.</P>

      <H2>Verify a backup</H2>
      <P>
        Verification downloads the backup if needed, checks its checksum, decrypts it, restores it into a throwaway database, and drops that
        database afterwards. The result is recorded on the backup as <strong>passed</strong> or <strong>failed</strong>, with details.
      </P>
      <CodeBlock lang="http" code={`POST /api/v1/backups/{run_id}/verify`} />
      <Callout type="tip">
        <p>Verify a recent backup after any change to a database’s schema or engine version, and periodically for critical data.</p>
      </Callout>

      <H2>Restore</H2>
      <Table
        head={["Mode", "What happens"]}
        rows={[
          [<C key="r">replace</C>, "Restores over the original database. Existing data in it is replaced."],
          [<C key="n">new</C>, <>Restores into a new database named by <C key="i">into</C>, leaving the original untouched.</>],
        ]}
      />
      <CodeBlock
        lang="http"
        code={`
POST /api/v1/backups/{run_id}/restore
{ "mode": "new", "into": "app_restored" }`}
      />
      <Callout type="warning" title="Replace is destructive">
        <p>
          Take a fresh backup first, or restore with <C>new</C>, inspect the result, and switch your app over. Restores are recorded in the
          audit log.
        </p>
      </Callout>

      <H3>Redis</H3>
      <P>
        For Redis, verification decrypts the backup and checks it is a valid RDB snapshot. Restoring a <strong>managed</strong> Redis
        instance replaces its whole dataset in place: VPSPilot stops it, loads the snapshot, rebuilds its append-only file and starts it again.
        If anything fails, the previous data is put back. Redis logins are kept. External Redis instances are restored by hand (see{" "}
        <A href="/docs/backups/s3-storage#the-recovery-kit">the recovery kit</A> for decrypting a backup).
      </P>

      <H2>Deleting backups</H2>
      <P>Deleting a backup removes the local file and the copy in storage. Retention does the same for backups beyond each policy’s limit.</P>
    </>
  );
}

export function S3Storage() {
  return (
    <>
      <P>
        Backups on the same disk as the database don’t survive the loss of the server. Turn on <strong>Copy backups off the server</strong>{" "}
        in <strong>Settings → Backup Storage</strong> and every backup is uploaded straight from the server after it is encrypted, to
        S3-compatible storage or Google Drive.
      </P>
      <P>
        Each backup remembers where its copy went, so switching providers later is safe: restores and retention of older backups keep using
        the storage they were sent to, as long as it stays configured.
      </P>

      <H2>S3-compatible storage</H2>
      <P>
        Pick the service and VPSPilot builds the endpoint. Anything that speaks the S3 API with SigV4 signing works; plain <C>http://</C>{" "}
        endpoints are allowed for storage on a private network.
      </P>
      <Table
        head={["Service", "You enter", "Endpoint"]}
        rows={[
          ["Cloudflare R2", "Account ID", <C key="r">https://&lt;account&gt;.r2.cloudflarestorage.com</C>],
          ["Amazon S3", "Region", <C key="a">https://s3.&lt;region&gt;.amazonaws.com</C>],
          ["Backblaze B2", "Region", <C key="b">https://s3.&lt;region&gt;.backblazeb2.com</C>],
          ["DigitalOcean Spaces", "Region", <C key="d">https://&lt;region&gt;.digitaloceanspaces.com</C>],
          ["Wasabi", "Region", <C key="w">https://s3.&lt;region&gt;.wasabisys.com</C>],
          ["Other (MinIO, Garage…)", "Endpoint and region", "Anything you give it"],
        ]}
      />
      <Fields
        rows={[
          ["bucket", "string", "An existing bucket. VPSPilot doesn't create it."],
          ["folder (prefix)", "string", <>Optional folder inside the bucket, such as <C>vpspilot/prod</C>.</>],
          ["access key / secret key", "string", "Stored encrypted and never shown again."],
          ["keep a copy on the server", "bool · true", "Turn off to save disk space."],
        ]}
      />
      <H3>Cloudflare R2</H3>
      <P>
        Create the bucket, then <strong>R2 → Manage API tokens → Create API token</strong> with <strong>Object Read &amp; Write</strong> on
        that bucket. Use the <strong>Access Key ID</strong> and <strong>Secret Access Key</strong> it shows (not the token value), and your
        account ID from the R2 overview page.
      </P>
      <H3>Bucket permissions on AWS</H3>
      <P>The access key needs to read, write and delete objects under the folder. A minimal policy:</P>
      <CodeBlock
        lang="json"
        title="policy.json"
        code={`
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::my-backups/vpspilot/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::my-backups"
    }
  ]
}`}
      />

      <H2>Google Drive</H2>
      <P>
        VPSPilot connects to Drive through an OAuth client you create, and asks only for the <C>drive.file</C> permission: it sees nothing in
        your Drive except the files it creates, in a <strong>VPSPilot backups</strong> folder.
      </P>
      <Steps>
        <Step title="Enable the Drive API">
          <P>
            In <A href="https://console.cloud.google.com/apis/library/drive.googleapis.com">Google Cloud Console</A>, create or pick a
            project and enable the Google Drive API.
          </P>
        </Step>
        <Step title="Create an OAuth client">
          <P>
            Under <strong>APIs &amp; Services → Credentials</strong>, create an <strong>OAuth client ID</strong> of type{" "}
            <strong>Web application</strong>. Add the redirect URI shown in VPSPilot&apos;s Google Drive tab, which looks like:
          </P>
          <CodeBlock code={`https://pilot.example.com/api/v1/backups/gdrive/callback`} />
        </Step>
        <Step title="Publish the consent screen">
          <P>
            On the OAuth consent screen, set the publishing status to <strong>In production</strong>. In testing mode, Google withdraws
            access after 7 days.
          </P>
        </Step>
        <Step title="Connect">
          <P>
            Paste the client ID and secret in <strong>Settings → Backup Storage → Google Drive</strong>, save, then{" "}
            <strong>Connect Google Drive</strong> and approve. The connected account and folder are shown.
          </P>
        </Step>
      </Steps>
      <P>
        The long-lived Google token stays encrypted on the control plane; each backup job gets an access token valid for about an hour, and
        the server uploads in resumable 8 MiB chunks. <strong>Disconnect</strong> revokes VPSPilot&apos;s access; backups already in Drive
        stay there.
      </P>

      <H2>Test the connection</H2>
      <P>
        <strong>Test connection</strong> asks a server to upload and then delete a small file with the saved settings, so you know uploads
        will work from the place they actually happen.
      </P>
      <CodeBlock lang="http" code={`POST /api/v1/backups/settings/test?server_id={server_id}`} />

      <H2 id="the-recovery-kit">The recovery kit</H2>
      <P>
        Backups are encrypted before upload, so the storage provider only ever sees ciphertext, and without the backup key nobody can read
        them, including you. Download the <strong>recovery kit</strong> from <strong>Settings → Security</strong> (it asks for your
        password and is audited) and keep it offline. It contains the control plane&apos;s keys and the backup key, with the commands to
        decrypt a backup by hand:
      </P>
      <CodeBlock
        code={`
export VPB_KEY=…   # from the recovery kit
# PostgreSQL (*.pgdump.enc)
openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -pass env:VPB_KEY \\
  -in backup.pgdump.enc | pg_restore --no-owner -d DATABASE
# MySQL / MariaDB (*.sql.gz.enc)
openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -pass env:VPB_KEY \\
  -in backup.sql.gz.enc | gunzip | mysql DATABASE`}
      />
      <Callout type="security">
        <p>
          Download a new kit after rotating <C>ENCRYPTION_KEY</C>. On a self-hosted install, <C>sudo vpspilot backup</C> also saves the
          control plane&apos;s own database together with its keys.
        </p>
      </Callout>
    </>
  );
}
