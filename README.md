# Hierarchy Control

You might be aware that the standard control showing the Hierarchy will be removed from the platform by October 2025 ([more info](https://learn.microsoft.com/en-us/power-platform/important-changes-coming#hierarchy-control-in-model-driven-apps-is-deprecated)).

So I've decided to resolve the issue by creating it as a PCF control.
Sample implementation with the account table :

![](https://carfupstorage.blob.core.windows.net/sharex/2025_03_26_23-11-25_msedge.gif)

⚠️ Starting at version 1.2.0, the JSON schema changed in order to support more than 3 attributes, make sure you update it along with the solution.

Here are the steps to configure and use the control :

- Download the [latest solution](https://github.com/carfup/PCF_HierarchyControl/releases)

- Make sure that the Table has a "Hierarchy relationship" enabled ([details](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/define-query-hierarchical-data#define-hierarchical-data))

- Here are the parameters to prepare the control :

| Parameter    | Description                                                         | Required |
| :----------- | :------------------------------------------------------------------ | :------: |
| hostingField | Field to attach the control (text field)                            |    x     |
| JsonMapping  | JSON data containing the parameters which allow the control to work |    x     |

JSON Details : (sample with the account table)

```json
{
	"parentField" : "parentaccountid",  REQUIRED - Parent Record Field Link to the same Account Table (with the Hierarchy relationship enabled)
	"recordIdField" : "accountid",      REQUIRED - Primary Field of the Account table
	"lookupOtherTable" : "mylookupfieldid" OPTIONAL - Allow you to display the hierarchy from a lookup perspective (the base will be the lookup record)
						To properly configure it, you need to align the "parentField" and "recordIdField" with the lookup table definition
	"mapping" : ["name","telephone1","websiteurl", "address1_line1"], REQUIRED - List of attributes to display, first one will be the node title, others will be displayed in order
	"properties" : {
		"height": 500,    OPTIONAL - Force the Height in px (By default use the height available)
		"width": 1200,     OPTIONAL - Force the Width in px (By default use the full width available).
		"showZoom": true,     OPTIONAL - Display the zoom in, zoom out, fit to screen buttons (Default value : false)
		"showSearch": true     OPTIONAL - Display a search bar to find a node in the hierarchy (Default value : false)
	}
}
```

Here is how it will looking between the mapping and the rendering :
![](https://carfupstorage.blob.core.windows.net/sharex/2025_02_10_17-04-01_POWERPNT.png)



Each data type will have it's own icon next to the value.

## Advice for the configuration

- Hide the field label
- Keep a tab with one column in order to have to most of the space

- Configuration sample on the form level :
![](https://carfupstorage.blob.core.windows.net/sharex/2025_03_26_21-59-31_msedge.png)

Reference of the org chart library used here : https://github.com/bumbeishvili/org-chart
