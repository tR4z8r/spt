import { BundleLoader } from "@spt-aki/loaders/BundleLoader";
import { JsonUtil } from "@spt-aki/utils/JsonUtil";
import { VFS } from "@spt-aki/utils/VFS";
import { DependencyContainer } from "tsyringe";

class BundleInfo
{
    modPath: string;
    key: string;
    path: string;
    filepath: string;
    dependencyKeys: string[];

    constructor(modpath: string, bundle: any, bundlePath: string, bundleFilepath: string)
    {
        this.modPath = modpath;
        this.key = bundle.key;
        this.path = bundlePath;
        this.filepath = bundleFilepath;
        this.dependencyKeys = bundle.dependencyKeys || [];
    }
}

export class BundleLoaderOverride
{
    container: DependencyContainer;
    jsonUtil: JsonUtil;
    vfs: VFS;
    protected bundles: Record<string, BundleInfo> = {};

    constructor(
        container: DependencyContainer
    )
    { 
        this.container = container;
        this.vfs = container.resolve<VFS>("VFS");
        this.jsonUtil = container.resolve<JsonUtil>("JsonUtil");
    }

    public getBundles(local: boolean): BundleInfo[]
    {
        const result: BundleInfo[] = [];

        for (const bundle in this.bundles)
        {
            result.push(this.getBundle(bundle, local));
        }
        
        return result;
    }

    public getBundle(key: string, local: boolean): BundleInfo
    {
        //decode the bundle key name to support spaces, etc.
        key = decodeURI(key);
        
        const bundle = this.jsonUtil.clone(this.bundles[key]);

        if (local)
        {
            bundle.path = bundle.filepath;
        }

        delete bundle.filepath;
        return bundle;
    }

    public addBundles(modpath: string): void
    {
        const manifest = this.jsonUtil.deserialize<BundleManifest>(this.vfs.readFile(`${modpath}bundles.json`)).manifest;

        for (const bundle of manifest)
        {          
            // return a partial url. the complete url will be build on client side.
            const bundlePath = `/files/bundle/${bundle.key}`;
            const bundleFilepath = bundle.path || `${modpath}bundles/${bundle.key}`.replace(/\\/g, "/");
            this.addBundle(bundle.key, new BundleInfo(modpath, bundle, bundlePath, bundleFilepath));
        }
    }

    public addBundle(key: string, b: BundleInfo): void {
        this.bundles[key] = b;
    }

    public override(): void {

        const thisObj = this;

        this.container.afterResolution("BundleLoader", (_t, result: BundleLoader) => {
            result.addBundle = (key: string, b: BundleInfo) => {
                return thisObj.addBundle(key, b);
            }
            result.addBundles = (modpath: string) => {
                return thisObj.addBundles(modpath);
            }
            result.getBundle = (key: string, local: boolean) => {
                return thisObj.getBundle(key, local);
            }
            result.getBundles = (local: boolean) => {
                
                return thisObj.getBundles(local);
            }
        });
    }
}

export interface BundleManifest
{
    manifest: Array<BundleManifestEntry>
}

export interface BundleManifestEntry
{
    key: string
    path: string
}