import os
import shutil
import subprocess
import zipfile
import sys

print("=== Starting Mahameru Static Export Builder ===")
root_dir = os.path.abspath(".")
app_api_dir = os.path.join(root_dir, "app", "api")
temp_api_dir = os.path.join(root_dir, "temp_api_backup")
config_file = os.path.join(root_dir, "next.config.ts")
config_backup = os.path.join(root_dir, "next.config.ts.bak")
out_dir = os.path.join(root_dir, "out")
zip_output = os.path.join(root_dir, "public", "mahameru-hosting-public_html.zip")

try:
    # 1. Backup next.config.ts
    shutil.copyfile(config_file, config_backup)
    
    # 2. Write export config
    with open(config_file, "w", encoding="utf-8") as f:
        f.write('''import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  transpilePackages: ['motion'],
};

export default nextConfig;
''')
        
    # 3. Move app/api temporarily if exists
    api_moved = False
    if os.path.exists(app_api_dir):
        if os.path.exists(temp_api_dir):
            shutil.rmtree(temp_api_dir)
        shutil.move(app_api_dir, temp_api_dir)
        api_moved = True
        print("[1/5] API route temporarily moved to backup")

    # 4. Run next build
    print("[2/5] Running next build (static export)...")
    env = os.environ.copy()
    env["NODE_ENV"] = "production"
    res = subprocess.run(["npx", "next", "build"], cwd=root_dir, env=env, capture_output=True, text=True)
    if res.returncode != 0:
        print("Build failed:", res.stderr)
        print("Stdout:", res.stdout)
        raise RuntimeError("Next.js build failed")
    print("[3/5] Static export generated successfully in /out")

    # 5. Ensure api.php and .htaccess are in /out
    public_api = os.path.join(root_dir, "public", "api.php")
    public_htaccess = os.path.join(root_dir, "public", ".htaccess")
    if os.path.exists(public_api):
        shutil.copyfile(public_api, os.path.join(out_dir, "api.php"))
    if os.path.exists(public_htaccess):
        shutil.copyfile(public_htaccess, os.path.join(out_dir, ".htaccess"))
    print("[4/5] api.php and .htaccess copied to /out")

    # 6. Create ZIP archive
    if os.path.exists(zip_output):
        os.remove(zip_output)
        
    with zipfile.ZipFile(zip_output, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(out_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, out_dir)
                zipf.write(file_path, arcname)

    zip_size_mb = os.path.getsize(zip_output) / (1024 * 1024)
    print(f"[5/5] Created ZIP file: {zip_output} ({zip_size_mb:.2f} MB)")

finally:
    # Always restore original state
    if os.path.exists(config_backup):
        shutil.copyfile(config_backup, config_file)
        os.remove(config_backup)
    if 'api_moved' in locals() and api_moved and os.path.exists(temp_api_dir):
        if os.path.exists(app_api_dir):
            shutil.rmtree(app_api_dir)
        shutil.move(temp_api_dir, app_api_dir)
        print("Original app/api and next.config.ts restored successfully")

print("=== Build Complete! File is ready at /public/mahameru-hosting-public_html.zip ===")
