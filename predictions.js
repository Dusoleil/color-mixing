import {Color} from "color"
import * as proj from "projections"
import {glMatrix,vec2,vec3,vec4,mat2,mat3,mat4} from "glMatrix"

export function calculate_setpoints_by_ratio(current,target,anchor,moving_comps,moving_sps)
{
    let bary1 = proj.barycentric_hull(current,[...moving_comps,anchor]).slice(0,-1);
    let bary2 = proj.barycentric_hull(target,[...moving_comps,current]);
    let bc = bary2.at(-1);
    bc = (bc <= 0) ? (1+Math.abs(bc)) : (1/bc);
    bary2 = bary2.slice(0,-1);
    let new_sp = moving_comps.map((_,c)=>
    {
        let b1 = bary1[c];
        b1 = (b1 <= 0) ? (1+Math.abs(b1)) : (1/b1);
        let sp = moving_sps[c];
        sp = (sp == 0) ? 1 : sp;
        let d = (bary2[c] * sp * bc * b1);
        return moving_sps[c] + d;
    });
    return new_sp;
}

export function predict_ratio(current,anchor,moving_comps,old_sp,delta_sp)
{
    let bary1 = proj.barycentric_hull(current,[...moving_comps,anchor]).slice(0,-1);
    let lin_eq_right = new Array(moving_comps.length).fill(0);
    lin_eq_right.push(1);
    let lin_eq_left = [];
    for(let i in moving_comps)
    {
        for(let j in moving_comps)
        {
            if(i==j)
                lin_eq_left.push(old_sp[i]!=0?old_sp[i]:glMatrix.EPSILON);
            else
                lin_eq_left.push(0);
        }
        lin_eq_left.push(1);
    }
    for(let i in moving_comps)
    {
        let b1 = bary1[i];
        b1 = b1 <= 0 ? 1/(1+Math.abs(b1)) : b1;
        let lc = (-1*delta_sp[i]*b1);
        lin_eq_left.push(lc!=0?lc:glMatrix.EPSILON);
    }
    lin_eq_left.push(1);
    if(moving_comps.length == 1)
    {
        lin_eq_left = mat2.clone(lin_eq_left);
        lin_eq_right = vec2.clone(lin_eq_right);
        let inv_left = mat2.create();
        mat2.invert(inv_left,lin_eq_left);
        let solution = vec2.create();
        vec2.transformMat2(solution,lin_eq_right,inv_left);
        return solution;
    }
    if(moving_comps.length == 2)
    {
        lin_eq_left = mat3.clone(lin_eq_left);
        lin_eq_right = vec3.clone(lin_eq_right);
        let inv_left = mat3.create();
        mat3.invert(inv_left,lin_eq_left);
        let solution = vec3.create();
        vec3.transformMat3(solution,lin_eq_right,inv_left);
        return solution;
    }
    if(moving_comps.length == 3)
    {
        lin_eq_left = mat4.clone(lin_eq_left);
        lin_eq_right = vec4.clone(lin_eq_right);
        let inv_left = mat4.create();
        mat4.invert(inv_left,lin_eq_left);
        let solution = vec4.create();
        vec4.transformMat4(solution,lin_eq_right,inv_left);
        return solution;
    }
}

export function predict_color_by_ratio(current,comp_colors,old_sp,new_sp)
{
    let anchor = comp_colors.findIndex((_,c)=>old_sp[c] == new_sp[c]);
    let moving_comps = comp_colors.toSpliced(anchor,1);
    let sp = old_sp.toSpliced(anchor,1);
    let delta_sp = new_sp.toSpliced(anchor,1);
    let i;
    while((i = sp.findIndex((s,p)=>s==0&&delta_sp[p]==0))>=0)
    {
        moving_comps = moving_comps.toSpliced(i,1);
        sp = sp.toSpliced(i,1);
        delta_sp = delta_sp.toSpliced(i,1);
    }
    delta_sp = delta_sp.map((s,i)=>s-sp[i]);
    anchor = comp_colors[anchor];
    let ratio = predict_ratio(current,anchor,moving_comps,sp,delta_sp);
    let predict = vec3.fromValues(...current);
    for(let c in moving_comps)
    {
        let d = vec3.distance(current,moving_comps[c]) * ratio[c];
        let part = vec3.create();
        vec3.sub(part,moving_comps[c],current);
        vec3.normalize(part,part);
        vec3.scale(part,part,d);
        vec3.add(predict,predict,part);
    }
    return Color.from_xyz("Predicted Color (Method 1)",predict);
}

export function calculate_setpoint(old_sp,old_anchor,new_anchor,old_bary,new_bary,old_anchor_bary,new_anchor_bary)
{
    if(new_bary <= 0) return 0;
    if(old_sp <= 0 || new_anchor <= 0 || old_anchor_bary <= 0 || old_anchor <= 0 || new_anchor_bary <= 0) return new_bary;
    if(old_bary <= 0) return old_sp;
    return (new_anchor*old_sp*old_anchor_bary*new_bary)/(old_anchor*new_anchor_bary*old_bary);
}

export function calculate_setpoints_fixed_sum(old_sp1,old_sp2,fixed_sum,old_bary1,old_bary2,new_bary1,new_bary2)
{
    if(fixed_sum <= 0) return [0,0];
    if(new_bary1 <= 0) return [0,fixed_sum];
    if(new_bary2 <= 0) return [fixed_sum,0];
    if(old_sp1 <= 0 || old_sp2 <= 0) return [new_bary1,new_bary2];
    if(old_bary1 <= 0) return [old_sp1,fixed_sum-old_sp1];
    if(old_bary2 <= 0) return [old_sp2,fixed_sum-old_sp2];
    let lin_eq_left = mat2.fromValues(-1*(old_sp2*old_bary1*new_bary2)/(old_sp1*new_bary1*old_bary2),1,1,1);
    let lin_eq_right = vec2.fromValues(0,fixed_sum);
    let inv_left = mat2.create();
    mat2.invert(inv_left,lin_eq_left);
    let solution = vec2.create();
    vec2.transformMat2(solution,lin_eq_right,inv_left);
    return solution;
}

export function predict_barycentric(old_sp,new_sp,old_bary)
{
    let lin_eq_left = [];
    let lin_eq_right = [];
    for(let j = 0; j < old_bary.length; j++)
    {
        for(let i = 1; i < old_bary.length; i++)
        {
            if(j==0)
                lin_eq_left.push(old_sp[0]*new_sp[i]*old_bary[i]);
            else if(i==j)
            {
                let l = -1*new_sp[0]*old_bary[0]*old_sp[i];
                lin_eq_left.push(l!=0?l:glMatrix.EPSILON);
            }
            else
                lin_eq_left.push(0);
        }
        lin_eq_left.push(1);
    }
    for(let i = 1; i < old_bary.length; i++)
        lin_eq_right.push(0);
    lin_eq_right.push(1);
    if(old_bary.length == 2)
    {
        lin_eq_left = mat2.clone(lin_eq_left);
        lin_eq_right = vec2.clone(lin_eq_right);
        let inv_left = mat2.create();
        mat2.invert(inv_left,lin_eq_left);
        let solution = vec2.create();
        vec2.transformMat2(solution,lin_eq_right,inv_left);
        return solution;
    }
    if(old_bary.length == 3)
    {
        lin_eq_left = mat3.clone(lin_eq_left);
        lin_eq_right = vec3.clone(lin_eq_right);
        let inv_left = mat3.create();
        mat3.invert(inv_left,lin_eq_left);
        let solution = vec3.create();
        vec3.transformMat3(solution,lin_eq_right,inv_left);
        return solution;
    }
    if(old_bary.length == 4)
    {
        lin_eq_left = mat4.clone(lin_eq_left);
        lin_eq_right = vec4.clone(lin_eq_right);
        let inv_left = mat4.create();
        mat4.invert(inv_left,lin_eq_left);
        let solution = vec4.create();
        vec4.transformMat4(solution,lin_eq_right,inv_left);
        return solution;
    }
}

export function predict_color_by_barycentric(current,comp_colors,old_sp,new_sp)
{
    let cur_proj = proj.project_onto_hull(current,comp_colors);
    let cur_bary = proj.barycentric_hull_bounded(current,comp_colors);
    let predict_proj = predict_barycentric(old_sp,new_sp,cur_bary);
    predict_proj = proj.get_composite_from_barycentric(comp_colors,predict_proj);
    let predict = vec3.clone(current);
    let moved_comps = comp_colors.filter((_,i)=>old_sp[i]!=new_sp[i]);
    if(moved_comps.length >= 4 || moved_comps.length == comp_colors.length)
    {
        let move_vec = vec3.create();
        vec3.sub(move_vec,predict_proj,cur_proj);
        vec3.add(predict,predict,move_vec);
    }
    else if(moved_comps.length >= 1)
    {
        let bary = [...moved_comps,cur_proj];
        bary = proj.barycentric_hull(predict_proj,bary);
        for(let c in moved_comps)
        {
            let part = vec3.clone(moved_comps[c]);
            vec3.sub(part,part,current);
            vec3.normalize(part,part);
            let d = proj.point_to_point_distance(cur_proj,moved_comps[c]);
            vec3.scale(part,part,bary[c]*d);
            vec3.add(predict,predict,part);
        }
    }
    predict = Color.from_xyz("Predicted Color (Method 2)",predict);
    return predict;
}
