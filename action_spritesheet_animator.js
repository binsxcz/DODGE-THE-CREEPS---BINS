/*	Info 
	
	Extension Name	: Action Spritesheet Animation
	Extension Type	: Action
	Author:			: Vazahat Khan (just_in_case)
	Date Created	: December 13, 2021, 11:01 AM
	Description		: Allows you to use a spritesheet to animate a 2D character or objects. 
	
*/
/* 	Donate
	
	If you like my work, please consider "buy me a cup of coffee" to support me.
	You can do that via PayPal :)
	
	PayPal: http://paypal.me/Vazahat
	

*/
/*	Changelog

    [December 12, 2021]	- Added Basic Shader code
					- Added Shader Constants to use in shaders ( Columns, Rows, CurrentFrame)
					- Calculation of Scale and Offset of tileSize, CurrentFrame and rows and columns
					- Fixed an issue that was due to the usage of float values instead of integers
	[July 13, 2021]	- Converted the Shader into an action
					- Added different parameters (Actions property to control the shader)
					- Wasted so many hours debugging an issue with animation timing
    [July 14, 2021] - Found another issue with the offset mapping 
					- Fixed the issue with offset mapping also fixed the animation timing issue
					- Added ability to change StartFrame and EndFrame via variables
					- Added ability to increase or decrease animation timing(speed) via variable
					- Added option to choose a base material type for the Shader ( not all the material types work for example normal map doesn't work)
					  Use material type id for base material type for example (12 for Tranparent_Add material type)
	[April 4, 2022] - Added parameter to execute an action on one complete animation cycle.
*/



/* Usage
  Attach this action to a behavior and fill the parameters, Select the Affecting_node (the node on which the spritesheet texture is applied), Set the base_material_type, and number of rows and columns
  according to the spritesheet. For example if your spritesheet has 12 columns and 8 rows, fill them in the rows and columns field, specify the AinmationTime( it is the time one frame takes to switch to another frame )
  then specify the StartFrame and EndFrame for your animation, it is the number of tile(sprite) through which you want the animation to get started and the number(index) of sprite at which you want the animation to end.
  You can also use some variables to control the extension settings during the gameplay. You can use variables to set startframe and endframe and animationtime (speed). To use the variables, simply use the inbuilt set or change a variable action and then use the variable name that will be in this format.

-	nodename.startframe
-	nodename.endframe
-	nodename.animationtime

  here nodename is the name of the node on which the sprite sheet texture is applied to (affecting node supplied in the action parameter). 
  For more detailed usage visit the Author's website or the youtube channel.
  
	Itch.io - https://vazahat.itch.io/cc-shader-spritesheet-animation
	Youtube - https://www.youtube.com/channel/UC_yfoGEKkmY63tnyy6hR7ZQ
	Website - https://neophyte.cf
  
*/

/*  <action jsname="action_spritesheet_animator" description="Spritesheet Animator">
	  <property name="Affecting_node" type="scenenode"/>
	  <property name="Affect_all_material" type="bool" default="true" />
	  <property name="Affecting_material" type="int" default="1" />
	  <property name="Base_material_type" type="int" default="0" />
	  <property name="Columns" type="int" default="12" />
	  <property name="Rows" type="int"	default="8"/>
	  <property name="AnimationTime" type="int"	default="10"/>
	  <property name="StartFrame" type="int"	default="1"/>
	  <property name="EndFrame" type="int"	default="12"/>
	  <property name="Action_On_Finish" type="action"/>      
    </action>
*/

if(!spritesheetCache) 
	var spritesheetCache = { StartFrame: false, EndFrame: false };

action_spritesheet_animator = function(){};

action_spritesheet_animator.prototype.execute = function()
{	
	var timeMs = 1;
	this.Affecting_material -= 1;
	this.nodeName = ccbGetSceneNodeProperty(this.Affecting_node,"Name");
	// setting variables to be used
	ccbSetCopperCubeVariable(this.nodeName+".startframe",this.StartFrame);
	ccbSetCopperCubeVariable(this.nodeName+".endframe",this.EndFrame);
	ccbSetCopperCubeVariable(this.nodeName+".animationtime",this.AnimationTime);
	//print(spritesheetCache.StartFrame);

	if(this.StartFrame == spritesheetCache.StartFrame && this.EndFrame == spritesheetCache.EndFrame) return false;
	spritesheetCache.StartFrame = this.StartFrame; 
	spritesheetCache.EndFrame = this.EndFrame;
	
	
//Shader Part


var vertexShader = 
"float4x4 mWorldViewProj;  // World * View * Projection \n" + 
"float4x4 mInvWorld;       // Inverted world matrix	 	\n" + 
"float4x4 mTransWorld;     // Transposed world matrix	\n" + 
"														\n" + 
"// Vertex shader output structure						\n" + 
"struct VS_OUTPUT										\n" + 
"{														\n" + 
"	float4 Position   : POSITION;   // vertex position 	\n" + 
"	float4 Diffuse    : COLOR0;     // vertex diffuse 	\n" + 
"	float2 TexCoord   : TEXCOORD0;  // tex coords		\n" + 
"};														\n" + 
"														\n" + 
"VS_OUTPUT main      ( in float4 vPosition : POSITION,	\n" + 
"                      in float3 vNormal   : NORMAL,	\n" + 
"                      float2 texCoord     : TEXCOORD0 )\n" + 
"{														\n" + 
"	VS_OUTPUT Output;									\n" + 
"														\n" + 
"	// transform position to clip space 				\n" + 
"	Output.Position = mul(vPosition, mWorldViewProj);	\n" + 
"														\n" + 
"	// transformed normal would be this:				\n" + 
"	float3 normal = mul(vNormal, mInvWorld);			\n" + 
"														\n" + 
"	// position in world coodinates	would be this:		\n" + 
"	// float3 worldpos = mul(mTransWorld, vPosition);	\n" + 
"														\n" + 
"	Output.Diffuse = float4(1.0, 1.0, 1.0, 1.0);		\n" + 
"	Output.TexCoord = texCoord;							\n" + 
"														\n" + 
"	return Output;										\n" + 
"}														";

var fragmentShader = 
"struct PS_OUTPUT													\n" + 
"{																	\n" + 
"    float4 RGBColor : COLOR0; 		  								\n" +	
"};																	\n" +
"																	\n" + 
"float4 columns;													\n" +
"float4 rows;														\n" +
"float4 currentFrame;												\n" +
"sampler2D tex0;													\n" + 
"																	\n" +
"PS_OUTPUT main( float2 TexCoord : TEXCOORD0,						\n" +
"                float4 Position : POSITION,						\n" +
"                float4 Diffuse  : COLOR0 ) 						\n" +
"{ 																	\n" +
"	PS_OUTPUT Output;												\n" +
" int colm = columns.x;												\n" + //conversion into integers value
" int rw = rows.x;													\n" +
" int cf = currentFrame.x;											\n" +
"   float2 texSize = float2(1.0 / columns.x, 1.0 / rows.x); 		\n" + //getting the tile Size
"   float2 texXY = float2(cf % colm , cf % (colm*rw) / colm);		\n" + //getting the tile offset
"   float2 texUV = TexCoord * texSize + texXY * texSize;  			\n" + //scaling and adding the offset to texcoord
"	float4 col = tex2D( tex0, texUV );  							\n" + //setting final output texcoords
"	Output.RGBColor =  col;											\n" + //result
"	return Output;													\n" +
"}";

var me = this; 
var CurrentFrame = ccbGetCopperCubeVariable(me.nodeName+".startframe")-1; // to calculate the animation

myShaderCallBack = function()
{
	timeMs++; //setting a virtual timer for animations
	//getting variables and apply them to  calculate animation
	var EndFrame  = ccbGetCopperCubeVariable(me.nodeName+".endframe")-1;
	var StartFrame = ccbGetCopperCubeVariable(me.nodeName+".startframe")-1;
	var animspeed = ccbGetCopperCubeVariable(me.nodeName+".animationtime");
	if(timeMs > animspeed){timeMs = 1; CurrentFrame++;} //check the virtual time with the animationspeed and move to next frame
	if(CurrentFrame > EndFrame){ CurrentFrame = StartFrame;ccbInvokeAction(me.Action_On_Finish);} //reset the animation cycle once the currentframe reaches to the endframe
	
	//setting shader constant values
	var currentFrame = CurrentFrame; 
	var columns = me.Columns;
	var rows = me.Rows;
	ccbSetShaderConstant(2, 'columns', columns, 0, 0, 0);
	ccbSetShaderConstant(2, 'rows', rows, 0, 0, 0);
	ccbSetShaderConstant(2, 'currentFrame', currentFrame, 0, 0, 0);
}

// creating Material
var newMaterial = ccbCreateMaterial(vertexShader, fragmentShader, this.Base_material_type, myShaderCallBack);

//Check Material index and apply to specified mat index or to all the materials.
var matCount = ccbGetSceneNodeMaterialCount(this.Affecting_node);

for(var i=0; i<matCount; ++i)
{
	if(this.Affect_all_material)
	{
		ccbSetSceneNodeMaterialProperty(this.Affecting_node, i, 'Type', newMaterial);
	}
	else {ccbSetSceneNodeMaterialProperty(this.Affecting_node, this.Affecting_material, 'Type', newMaterial);}
}
}