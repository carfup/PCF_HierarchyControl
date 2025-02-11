# Hierarchy Control

You might be aware that the standard control showing the Hierarchy will be removed from the platform by October 2025 ([more info](https://learn.microsoft.com/en-us/power-platform/important-changes-coming#hierarchy-control-in-model-driven-apps-is-deprecated)).

So I've decided to resolve the issue by creating it as a PCF control.
Sample implementation with the account table :

![](https://carfupstorage.blob.core.windows.net/sharex/2025_02_06_11-07-35_msedge.png)

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
	"mapping" : {
      "name" : "name",                REQUIRED - Primary name displayed in the card
      "attribute1" : "telephone1",    OPTIONAL - First attribute displayed in the card
      "attribute2" : "websiteurl",    OPTIONAL - Second attribute displayed in the card
      "attribute3" : "address1_line1" OPTIONAL - Thrid attribute displayed in the card
    },
	"properties" : {
		"height": 450,    OPTIONAL - Force the Height in px (By default use the height available)
		"width": 1230     OPTIONAL - Force the Width in px (By default use the full width available)
	}
}
```

Here is how it will looking between the mapping and the rendering :
![](https://carfupstorage.blob.core.windows.net/sharex/2025_02_10_17-04-01_POWERPNT.png)

Each data type will have it's own icon next to the value.

## Advice for the configuration

- Hide the field label
- Keep a tab with one column in order to have to most of the space
