import { View } from "ui/core/view";
import { parse } from "ui/builder";
import * as common from "./accordion.common";
import * as types from "utils/types";
import { AccordionItem } from "./accordion.common";
import { Color } from "color";
import * as utils from "utils/utils";
import * as platform from "platform";
import { StackLayout } from "ui/layouts/stack-layout";
import { Property } from "ui/core/dependency-observable";
import { PropertyMetadataSettings } from "ui/core/dependency-observable";
import { PropertyChangeData } from "ui/core/dependency-observable";
import { PropertyMetadata } from "ui/core/proxy";
import { EventData, Observable } from "data/observable";
export const ITEMLOADING = "itemLoading";
export const ITEMTAP = "itemTap";
export const LOADMOREITEMS = "loadMoreItems";
import { ios } from "utils/utils";

global.moduleMerge(common, exports);
const DEFAULT_HEIGHT: number = 44;
const infinity = utils.layout.makeMeasureSpec(0, utils.layout.UNSPECIFIED);
function notifyForItemAtIndex(listView, cell: any, view: View, eventName: string, indexPath: NSIndexPath) {
    let args = { eventName: eventName, object: listView, index: indexPath.row, view: view, ios: cell, android: undefined };
    listView.notify(args);
    return args;
}

const AccordionViewCellReuseIdentifier = "AccordionCellReuseIdentifier";
const DefaultAccordionHeaderViewHeight = 44.0;
const AccordionHeaderViewReuseIdentifier = "AccordionHeaderViewReuseIdentifier";
export class Accordion extends common.Accordion {

    public headerTemplateUpdated(oldData: any, newData: any): void {
    }

    public footerTemplateUpdated(oldData: any, newData: any): void {
    }

    public templateUpdated(oldData: any, newData: any): void {

    }
     public updateItems(oldItems: any, newItems: any) {
        if (newItems) {
            newItems.on("change", (args) => {
                this._ios.reloadData();
            });
        }
    }

    _expandedViews: Map<any, any>;
    _indexSet: NSMutableIndexSet;
    public groupCollapsed(index: number): void {
        //throw new Error('Method not implemented.');
    }

    private _ios: UITableView;
    private _accordion;
    widthMeasureSpec: number;
    heightMeasureSpec: number;
    private left = 0;
    private top = 0;
    private right = 0;
    private bottom = 0;
    _dataSource: AccordionDataSource;
    _delegate;
    private _map: Map<AccordionCell, View>;
    constructor() {
        super();
        this._ios = UITableView.new();
        // this._ios.registerClassForCellReuseIdentifier(AccordionCell.class(), AccordionViewCellReuseIdentifier);
        // this.ios.registerNibForHeaderFooterViewReuseIdentifier(UINib.nibWithNibNameBundle("AccordionHeaderView", null), AccordionHeaderViewReuseIdentifier);
        this._ios.autoresizingMask = UIViewAutoresizing.None;
        this._ios.estimatedRowHeight = DEFAULT_HEIGHT;
        this._ios.rowHeight = UITableViewAutomaticDimension;
        this._dataSource = AccordionDataSource.initWithOwner(new WeakRef(this));
        this._delegate = UITableViewDelegateImpl.initWithOwner(new WeakRef(this));
        this._setNativeClipToBounds();
        this._expandedViews = new Map();
        this._indexSet = NSMutableIndexSet.alloc().init();
    }
    _setNativeClipToBounds() {
        this._ios.clipsToBounds = true;
    }

    get ios() {
        return this._ios;
    }

    get _nativeView() {
        return this._ios;
    }

    addItem(view: AccordionItem) {
    }

    onLoaded() {
        super.onLoaded();
        this._expandedViews.set(this.selectedIndex, true);
        this._indexSet.addIndex(this.selectedIndex);
        this.requestLayout();
        this._ios.dataSource = this._dataSource;
        this._ios.delegate = this._delegate;
        if (this.separatorColor) {
            this.ios.separatorColor = new Color(this.separatorColor).ios;
        }
    }

    public onUnloaded() {
        this._ios.delegate = null;
        super.onUnloaded();
    }

    public scrollToIndex(index: number) {
        if (this._ios) {
            this._ios.scrollToRowAtIndexPathAtScrollPositionAnimated(NSIndexPath.indexPathForItemInSection(index, 0),
                UITableViewScrollPosition.Top, false);
        }
    }


    public measure(widthMeasureSpec: number, heightMeasureSpec: number): void {
        this.widthMeasureSpec = widthMeasureSpec;
        var changed = this._setCurrentMeasureSpecs(widthMeasureSpec, heightMeasureSpec);
        super.measure(widthMeasureSpec, heightMeasureSpec);
        if (changed) {
            this._ios.reloadData();
        }
    }
    get _childrenCount(): number {
        return this.items ? this.items.length : 0;
    }

    indexChanged(index: number) {
        this.notifyPropertyChange("selectedIndex", index);
    }
}

const headerTextProperty = new Property("headerText", "Item", new PropertyMetadata(undefined, PropertyMetadataSettings.None));
(<PropertyMetadata>headerTextProperty.metadata).onSetNativeValue = function (data: PropertyChangeData) {
    const item = <Item>data.object;
    item.headerTextChanged(data.newValue, item);
};

export class AccordionHeaderViewCell extends UITableViewCell { }

export class Item extends StackLayout {
    public static headerTextProperty = headerTextProperty;

    constructor() {
        super();
    }

    public headerTextChanged(text: string, view: any) {
        const index = view.tag;
        if (view && view.parent.ios) {
            view.parent.ios.subviews[0].subviews[index].subviews[0].setTitleForState(text, UIControlState.Normal);
        }
    }

    get headerText() {
        return this._getValue(Item.headerTextProperty);
    }

    set headerText(text: string) {
        this._setValue(Item.headerTextProperty, text);
    }

}


export class AccordionDataSource extends NSObject implements UITableViewDataSource {
    public static ObjCProtocols = [UITableViewDataSource];
    private _owner: WeakRef<Accordion>;
    public static initWithOwner(owner: WeakRef<Accordion>): AccordionDataSource {
        let dataSource = <AccordionDataSource>AccordionDataSource.new();
        dataSource._owner = owner;
        return dataSource;
    }

    public tableViewNumberOfRowsInSection(tableView: UITableView, section: number) {
        let owner = this._owner.get();
        if (owner._expandedViews.has(section)) {
            return (owner && owner.items && owner._getParentData(section)['items']) ? owner._getParentData(section)['items'].length : 0;
        } else {
            return 0;
        }

    }

    public numberOfSectionsInTableView(tableView) {
        let owner = this._owner.get();
        return (owner && owner.items) ? owner.items.length : 0;
    }

    public tableViewTitleForHeaderInSection(tableView: UITableView, section: number) {
        let owner = this._owner.get();
        return owner._getParentData(section).headerText;
    }

    public tableViewCellForRowAtIndexPath(tableView: UITableView, indexPath: NSIndexPath) {
        let owner = this._owner.get();
        let cell: AccordionCell;
        if (owner) {
            const has = owner._expandedViews.has(indexPath.section);
            const selected = owner._expandedViews.get(indexPath.section);
            if (has && !selected) {
                cell = <AccordionCell>AccordionCell.new();
            } else {
                cell = <AccordionCell>AccordionCell.new();

                owner._expandedViews.set(indexPath.section, true);

                const view = !types.isNullOrUndefined(owner.itemTemplate) ? parse(owner.itemTemplate, this) : null;
                const data = owner._getChildData(indexPath.section, indexPath.row);
                view.bindingContext = new Observable(data);

                const rowHeight = owner._effectiveRowHeight;

                const heightMeasureSpec: number = rowHeight >= 0 ? utils.layout.makeMeasureSpec(rowHeight, utils.layout.EXACTLY) : infinity;
                const measuredSize = View.measureChild(owner, view, owner.widthMeasureSpec, heightMeasureSpec);
                const height = measuredSize.measuredHeight;
                const width = measuredSize.measuredWidth;
                View.layoutChild(owner, view, 0, 0, width, height);
                cell.contentView.addSubview(view._nativeView);
                owner._addView(view);
            }
        }
        else {
            cell = <AccordionCell>AccordionCell.new();
        }


        return cell;

        // console.log("cell")
        // let owner = this._owner.get();
        // const cell = owner.ios.dequeueReusableCellWithIdentifierForIndexPath(AccordionViewCellReuseIdentifier, indexPath);
        // cell.textLabel.text = "Cell";
        // return cell;

    }


}

export class AccordionCell extends UITableViewCell {

    public willMoveToSuperview(newSuperview: UIView): void {

        //let parent = <Accordion>(this.view ? this.view.parent : null);

        // When inside ListView and there is no newSuperview this cell is 
        // removed from native visual tree so we remove it from our tree too.
        // if (parent && !newSuperview) {
        //  parent._removeContainer(this);
        // }
    }
}

export class UITableViewDelegateImpl extends NSObject implements UITableViewDelegate {
    public static ObjCProtocols = [UITableViewDelegate];
    private _owner: WeakRef<Accordion>;
    public static initWithOwner(owner: WeakRef<Accordion>): UITableViewDelegateImpl {
        let delegate = <UITableViewDelegateImpl>UITableViewDelegateImpl.new();
        delegate._owner = owner;
        return delegate;
    }
    public tableViewHeightForRowAtIndexPath(tableView: UITableView, indexPath: NSIndexPath) {
        let owner = this._owner.get();
        if (owner._expandedViews.get(indexPath.section)) {
            const view = parse(owner.itemTemplate, this);
            view.bindingContext = owner._getChildData(indexPath.section, indexPath.row);
            owner._addView(view);
            const nativeView = view._nativeView;
            // view.ios.frame = CGRectMake(0, 0, 300, 300);
            //View.measureChild(owner, view, nativeView.frame.size.width, nativeView.frame.size.height);

            const rowHeight = owner._effectiveRowHeight;

            const heightMeasureSpec: number = rowHeight >= 0 ? utils.layout.makeMeasureSpec(rowHeight, utils.layout.EXACTLY) : infinity;
            const measuredSize = View.measureChild(owner, view, owner.widthMeasureSpec, heightMeasureSpec);
            const height = measuredSize.measuredHeight;
            const width = measuredSize.measuredWidth;
            View.layoutChild(owner, view, 0, 0, width, height);

            return view ? view.ios.frame.size.height : DEFAULT_HEIGHT;
        }
        return 0;
    }

    public tableViewEstimatedHeightForHeaderInSection(tableView: UITableView, section: number) {
        return DEFAULT_HEIGHT;
    }
    public tableViewHeightForHeaderInSection(tableView: UITableView, section: number) {
        let owner = this._owner.get();
        if (owner.headerHeight) {
            return owner.headerHeight;
        }
        return DEFAULT_HEIGHT;
    }
    public tableViewHeightForFooterInSection(tableView: UITableView, section: number) {
        let owner = this._owner.get();
        if (owner.footerHeight) {
            return owner.footerHeight;
        }
        return DEFAULT_HEIGHT;
    };

    public tableViewDidSelectRowAtIndexPath(tableView: UITableView, indexPath: NSIndexPath) {
        let owner = this._owner.get();
        let view = parse(owner.itemTemplate, this);
        view.bindingContext = new Observable(owner._getChildData(indexPath.section, indexPath.row))
        let args = { eventName: "itemTapped", object: owner, childIndex: indexPath.row, index: indexPath.section, view: view, ios: view.ios, android: undefined };
        owner.notify(args);
    }

    public tableViewWillDisplayHeaderViewForSection(tableView: UITableView, view: UIView, section: number) {
        let owner = this._owner.get();
        if (view instanceof UITableViewHeaderFooterView) {
            const headerView = (<UITableViewHeaderFooterView>view);
            if (owner.headerTextColor) {
                headerView.textLabel.textColor = new Color(owner.headerTextColor).ios;
            }
            if (owner.headerTextSize) {
                headerView.textLabel.font = UIFont.systemFontOfSize(owner.headerTextSize);
            }

            if (owner.headerTextAlignment === "center") {
                headerView.textLabel.textAlignment = NSTextAlignment.Center;
            } else if (owner.headerTextAlignment === "right") {
                headerView.textLabel.textAlignment = NSTextAlignment.Right;
            } else if (owner.headerTextAlignment === "left") {
                headerView.textLabel.textAlignment = NSTextAlignment.Left;
            } else {
                headerView.textLabel.textAlignment = NSTextAlignment.Natural;
            }

            if (owner.headerTextBold) {
                headerView.textLabel.font = UIFont.systemFontOfSizeWeight(UIFont.systemFontSize, UIFontWeightHeavy)
            }
        }
    }

    public tableViewWillDisplayFooterViewForSection(tableView: UITableView, view: UIView, section: number) {
        let owner = this._owner.get();
        if (view instanceof UITableViewHeaderFooterView) {
            const headerView = (<UITableViewHeaderFooterView>view);
            if (owner.footerTextColor) {
                headerView.textLabel.textColor = new Color(owner.footerTextColor).ios;
            }
            if (owner.footerTextSize) {
                headerView.textLabel.font = UIFont.systemFontOfSize(owner.footerTextSize);
            }

            if (owner.footerTextAlignment === "center") {
                headerView.textLabel.textAlignment = NSTextAlignment.Center;
            } else if (owner.footerTextAlignment === "right") {
                headerView.textLabel.textAlignment = NSTextAlignment.Right;
            } else if (owner.footerTextAlignment === "left") {
                headerView.textLabel.textAlignment = NSTextAlignment.Left;
            } else {
                headerView.textLabel.textAlignment = NSTextAlignment.Natural;
            }

            if (owner.footerTextBold) {
                headerView.textLabel.font = UIFont.systemFontOfSizeWeight(UIFont.systemFontSize, UIFontWeightHeavy)
            }
        }
    };

    public tableViewWillDisplayCellForRowAtIndexPath(tableView: UITableView, cell: UITableViewCell, indexPath: NSIndexPath) { }

    public tableViewViewForHeaderInSection(tableView: UITableView, section: number) {
        let owner = this._owner.get();
        const tapGesture = UITapGestureRecognizer.alloc().initWithTargetAction(AccordionHeaderTap.initWithOwner(this._owner), "tap");

        let view = !types.isNullOrUndefined(owner.headerTemplate) ? parse(owner.headerTemplate, this) : null;

        if (view) {
            const data = owner._getParentData(section);
            view.bindingContext = new Observable(data);
            const rowHeight = owner._effectiveRowHeight;
            const heightMeasureSpec: number = rowHeight >= 0 ? utils.layout.makeMeasureSpec(rowHeight, utils.layout.EXACTLY) : infinity;
            const measuredSize = View.measureChild(owner, view, owner.widthMeasureSpec, heightMeasureSpec);
            const height = measuredSize.measuredHeight;
            const width = measuredSize.measuredWidth;
            View.layoutChild(owner, view, 0, 0, width, height);
            view.ios.tag = section;
            view.ios.addGestureRecognizer(tapGesture);
            return view._nativeView;
        }


        const hv = UITableViewHeaderFooterView.new();
        hv.tag = section;
        hv.textLabel.text = owner._getParentData(section) ? owner._getParentData(section).headerText : "";
        hv.userInteractionEnabled = true;
        hv.autoresizingMask = UIViewAutoresizing.None;
        if (owner.headerColor) {
            hv.contentView.backgroundColor = new Color(owner.headerColor).ios;
        }
        tapGesture.delegate = this;
        hv.addGestureRecognizer(tapGesture);
        return hv;
    }
    public tableViewViewForFooterInSection(tableView: UITableView, section: number) {
        let owner = this._owner.get();

        let view = !types.isNullOrUndefined(owner.footerTemplate) ? parse(owner.footerTemplate, this) : null;

        if (view) {
            const data = owner._getParentData(section);
            view.bindingContext = new Observable(data);
            const rowHeight = owner._effectiveRowHeight;
            const heightMeasureSpec: number = rowHeight >= 0 ? utils.layout.makeMeasureSpec(rowHeight, utils.layout.EXACTLY) : infinity;
            const measuredSize = View.measureChild(owner, view, owner.widthMeasureSpec, heightMeasureSpec);
            const height = measuredSize.measuredHeight;
            const width = measuredSize.measuredWidth;
            View.layoutChild(owner, view, 0, 0, width, height);
            return view._nativeView;
        }

        if (owner._getParentData(section) && owner._getParentData(section).footerText) {
            const hv = UITableViewHeaderFooterView.new();
            hv.tag = section;
            hv.textLabel.text = owner._getParentData(section) ? owner._getParentData(section).footerText : "";
            if (owner.footerColor) {
                hv.contentView.backgroundColor = new Color(owner.footerColor).ios;
            }
            return hv;
        }

        return null;
    }

}

class AccordionHeaderTap extends NSObject {
    private _owner: WeakRef<Accordion>;
    public static initWithOwner(owner: WeakRef<Accordion>): AccordionHeaderTap {
        let tap: AccordionHeaderTap = new AccordionHeaderTap();
        tap._owner = owner;
        return tap;
    }
    tap(args) {
        let owner = this._owner.get();
        let current = args.view.tag;
        const reloadSection = (index: number) => {
            let section = NSMutableIndexSet.alloc().initWithIndex(index);
            owner.ios.reloadSectionsWithRowAnimation(section, UITableViewRowAnimation.Automatic);
        }
        /**
         *  Checks the allowMultiple property
         */
        if (owner.allowMultiple) {
            /**
             * Checks if the current tapped header is expanded
             * If expanded close item then remove  item from the indexSet
             */
            if (!owner._expandedViews.get(current)) {
                owner._expandedViews.set(current, true);
                owner._indexSet.addIndex(current);
            } else {
                owner._expandedViews.set(current, false);
                owner._indexSet.removeIndex(current);
            }
            /**
             * Call reload to expand or collapse section
             */
            reloadSection(current);
        } else {

            /**
             * Check if the view tapped is currently opened
             */
            if (!owner._expandedViews.get(current)) {

                /**
                 * Check if indexSet has more items
                 */
                if (owner._indexSet.count > 0) {
                    const previous = owner._indexSet.firstIndex;
                    owner._expandedViews.set(previous, false);
                    owner._indexSet.removeAllIndexes();

                    /**
                     * Call reload to collapse section
                     */
                    reloadSection(previous);

                    owner._expandedViews.set(current, true);
                    owner._indexSet.addIndex(current);

                } else {
                    owner._expandedViews.set(current, true);
                    owner._indexSet.addIndex(current);
                }

                /**
                 * Call reload to expand section
                 */

                reloadSection(current);

            } else {
                owner._expandedViews.set(current, false);
                owner._indexSet.removeIndex(current);
                /**
                 * Call reload to collapse section
                 */
                reloadSection(current);
            }

        }



    }
    public static ObjCExposedMethods = {
        "tap": { returns: interop.types.void, params: [interop.types.id] }
    };
}